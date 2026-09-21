import { homedir } from 'node:os'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile, rm } from 'node:fs/promises'
import { ADAPTERS, getAdapter } from './adapters.js'
import { absoluteRoot, atomicWrite, exists, listFiles, readJson, sha256, writeJson } from './fs.js'
import type { Adapter, AgentId, InstallOptions, InstalledFile, LockFile, OperationReport, PlannedFile, Scope } from './types.js'

export const PACKAGE_NAME = '@owlcodium/context-spec-develop'
export const PACKAGE_VERSION = '1.0.0'

function packageRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..')
}

export function installRoot(scope: Scope, requestedRoot?: string): string {
  return absoluteRoot(requestedRoot, scope === 'global' ? homedir() : process.cwd())
}

export function lockPath(scope: Scope, root: string): string {
  return join(root, '.agents', '.csd-lock.json')
}

function ownedPath(root: string, relativePath: string): string {
  const absolute = resolve(root, relativePath)
  const prefix = `${resolve(root)}${sep}`
  if (absolute !== resolve(root) && !absolute.startsWith(prefix)) {
    throw new Error(`Lockfile path escapes installation root: ${relativePath}`)
  }
  return absolute
}

async function skillContent(): Promise<string> {
  const candidates = [
    join(packageRoot(), 'skill', 'csd', 'SKILL.md'),
    join(packageRoot(), 'assets', 'template', 'skill', 'csd', 'SKILL.md'),
    join(process.cwd(), 'skill', 'csd', 'SKILL.md'),
  ]
  for (const candidate of candidates) if (await exists(candidate)) return readFile(candidate, 'utf8')
  throw new Error('CSD skill asset is missing from the package')
}

export async function templateRoot(): Promise<string> {
  const candidates = [join(packageRoot(), 'assets', 'template'), join(process.cwd(), 'assets', 'template'), packageRoot()]
  for (const candidate of candidates) if (await exists(join(candidate, '.context'))) return candidate
  throw new Error('CSD template assets are missing from the package')
}

function commandMarkdown(adapter: Adapter): string {
  return `# CSD\n\n${adapter.activation}\n\nApply the installed \`csd\` skill. Follow its CSD bootstrap protocol exactly: inspect first, show a preview before materializing missing context, wait for the user's confirmation, then run onboarding and the requested workflow.\n\nUser request: $ARGUMENTS\n`
}

function commandToml(adapter: Adapter): string {
  return `description = "Start the Context Spec Develop workflow"\nprompt = """\n${adapter.activation}\n\nApply the installed csd skill. Follow the CSD bootstrap protocol exactly: inspect first, show a preview before materializing missing context, wait for the user's confirmation, then run onboarding and the requested workflow.\n\nUser request: {{args}}\n"""\n`
}

export async function plannedFiles(agents: AgentId[], scope: Scope): Promise<PlannedFile[]> {
  const skill = await skillContent()
  const files = new Map<string, PlannedFile>()
  for (const id of agents) {
    const adapter = getAdapter(id)
    const skillPath = scope === 'global' && adapter.globalSkillPath ? adapter.globalSkillPath : adapter.skillPath
    const commandPath = scope === 'global' && adapter.globalCommandPath ? adapter.globalCommandPath : adapter.commandPath
    files.set(skillPath, { relativePath: skillPath, content: skill })
    if (commandPath && adapter.commandFormat === 'toml') {
      files.set(commandPath, { relativePath: commandPath, content: commandToml(adapter) })
    } else if (commandPath) {
      files.set(commandPath, { relativePath: commandPath, content: commandMarkdown(adapter) })
    }
  }
  return [...files.values()]
}

async function loadLock(scope: Scope, root: string): Promise<LockFile | undefined> {
  const lock = await readJson<LockFile>(lockPath(scope, root))
  if (!lock) return undefined
  if (lock.schemaVersion !== 1 || lock.package !== PACKAGE_NAME || lock.scope !== scope || !Array.isArray(lock.files)) {
    throw new Error(`Invalid CSD lockfile: ${lockPath(scope, root)}`)
  }
  for (const file of lock.files) {
    if (!file || typeof file.path !== 'string' || typeof file.sha256 !== 'string') throw new Error(`Invalid CSD lockfile entry: ${lockPath(scope, root)}`)
    ownedPath(root, file.path)
  }
  return lock
}

function mergeFiles(existing: InstalledFile[], additions: InstalledFile[]): InstalledFile[] {
  const byPath = new Map(existing.map((file) => [file.path, file]))
  for (const file of additions) byPath.set(file.path, file)
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path))
}

export async function install(options: InstallOptions): Promise<OperationReport> {
  const root = installRoot(options.scope, options.root)
  const agents = options.agents.length > 0 ? options.agents : ADAPTERS.map((adapter) => adapter.id)
  const plans = await plannedFiles(agents, options.scope)
  const skipped: string[] = []
  const warnings: string[] = []
  const installed: InstalledFile[] = []

  // Validate every collision before the first write so a rejected install cannot
  // leave a partially installed set of adapters behind.
  if (!options.force) {
    for (const plan of plans) {
      const target = ownedPath(root, plan.relativePath)
      if (await exists(target) && (await readFile(target, 'utf8')) !== plan.content) {
        throw new Error(`Refusing to overwrite existing file: ${target}. Use --force after reviewing it.`)
      }
    }
  }

  for (const plan of plans) {
    const target = ownedPath(root, plan.relativePath)
    const digest = await sha256(plan.content)
    if (await exists(target)) {
      const current = await readFile(target, 'utf8')
      if (current === plan.content) {
        skipped.push(plan.relativePath)
        installed.push({ path: plan.relativePath, sha256: digest })
        continue
      }
      if (!options.force) throw new Error(`Refusing to overwrite existing file: ${target}. Use --force after reviewing it.`)
      warnings.push(`Overwrote existing file: ${plan.relativePath}`)
    }
    await atomicWrite(target, plan.content)
    installed.push({ path: plan.relativePath, sha256: digest })
  }

  const previous = await loadLock(options.scope, root)
  const lock: LockFile = {
    schemaVersion: 1,
    package: PACKAGE_NAME,
    version: PACKAGE_VERSION,
    scope: options.scope,
    installedAt: new Date().toISOString(),
    agents: [...new Set([...(previous?.agents ?? []), ...agents])].sort(),
    files: mergeFiles(previous?.files ?? [], installed),
  }
  await writeJson(lockPath(options.scope, root), lock)
  return { scope: options.scope, root, agents, files: installed, skipped, warnings }
}

export async function inspect(scope: Scope, requestedRoot?: string): Promise<{ lock?: LockFile; problems: string[] }> {
  const root = installRoot(scope, requestedRoot)
  const lock = await loadLock(scope, root)
  if (!lock) return { problems: ['CSD is not installed in this scope'] }
  const problems: string[] = []
  for (const file of lock.files) {
    const target = ownedPath(root, file.path)
    if (!(await exists(target))) {
      problems.push(`missing: ${file.path}`)
      continue
    }
    const digest = await sha256(await readFile(target))
    if (digest !== file.sha256) problems.push(`modified: ${file.path}`)
  }
  return { lock, problems }
}

export async function remove(scope: Scope, requestedRoot?: string, force = false): Promise<string[]> {
  const root = installRoot(scope, requestedRoot)
  const lock = await loadLock(scope, root)
  if (!lock) throw new Error('CSD is not installed in this scope')
  const modified: string[] = []
  for (const file of lock.files) {
    const target = ownedPath(root, file.path)
    if (!(await exists(target))) continue
    const digest = await sha256(await readFile(target))
    if (!force && digest !== file.sha256) modified.push(file.path)
  }
  if (modified.length > 0) throw new Error(`Refusing to remove modified files: ${modified.join(', ')}. Use --force after reviewing them.`)
  const removed: string[] = []
  for (const file of lock.files) {
    const target = ownedPath(root, file.path)
    if (!(await exists(target))) continue
    await rm(target)
    removed.push(file.path)
  }
  await rm(lockPath(scope, root), { force: true })
  return removed
}

export async function bootstrap(targetRoot: string, force = false): Promise<{ created: string[]; skipped: string[] }> {
  const destination = resolve(targetRoot)
  const source = await templateRoot()
  const created: string[] = []
  const skipped: string[] = []
  const sourceFiles = (await listFiles(join(source, '.context'))).filter((file) => {
    const relativePath = relative(join(source, '.context'), file)
    return relativePath !== 'work' && !relativePath.startsWith('work/')
  })
  for (const file of sourceFiles) {
    const relativePath = relative(join(source, '.context'), file)
    const target = join(destination, '.context', relativePath)
    if (await exists(target) && !force) {
      skipped.push(join('.context', relativePath))
      continue
    }
    await atomicWrite(target, await readFile(file, 'utf8'))
    created.push(join('.context', relativePath))
  }
  const agentTarget = join(destination, 'AGENTS.md')
  const agentSource = join(source, 'AGENTS.md')
  if (await exists(agentTarget)) {
    const current = await readFile(agentTarget, 'utf8')
    const marker = '<!-- CSD:BEGIN -->'
    if (!current.includes(marker)) {
      await atomicWrite(agentTarget, `${current.trimEnd()}\n\n<!-- CSD:BEGIN -->\nThis repository uses context-spec-develop. Read \`.context/INDEX.md\` before operational work and follow the canonical front door.\n<!-- CSD:END -->\n`)
      created.push('AGENTS.md (CSD integration)')
    } else skipped.push('AGENTS.md')
  } else {
    await atomicWrite(agentTarget, await readFile(agentSource, 'utf8'))
    created.push('AGENTS.md')
  }
  return { created, skipped }
}
