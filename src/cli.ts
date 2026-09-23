#!/usr/bin/env node
import { resolve } from 'node:path'
import { activationTable, parseAgents } from './adapters.js'
import { inspect, install, PACKAGE_NAME, PACKAGE_VERSION, remove, update, updatePreview } from './installer.js'
import { bootstrapApply, bootstrapPreview, contextUpdateApply, contextUpdatePreview, describeDiscovery, discoverContext, moduleContextApply, moduleContextPreview } from './context.js'
import type { Scope } from './types.js'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

interface CliOptions {
  scope: Scope
  agents: string | undefined
  root: string | undefined
  force: boolean
}

function usage(): string {
  return `CSD ${PACKAGE_VERSION}\n\nUsage:\n  csd install [--agents <ids>] [--scope global|project] [--root <path>] [--force]\n  csd update [--scope global|project] [--root <path>] [--context] [--yes] [--dry-run] [--force]\n  csd remove [--scope global|project] [--root <path>] [--force]\n  csd list\n  csd doctor [--scope global|project] [--root <path>]\n  csd discover --root <project>\n  csd modules --root <project> [--preview|--yes|--decline|--dry-run]\n  csd bootstrap --root <project> [--yes|--force] [--dry-run]\n  csd mcp [--root <project>]\n\nAgents:\n${activationTable()}\n`
}

function optionValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

function parseOptions(args: string[]): CliOptions {
  const scope = (optionValue(args, '--scope') ?? 'global') as Scope
  if (scope !== 'global' && scope !== 'project') throw new Error('--scope must be global or project')
  return {
    scope,
    agents: optionValue(args, '--agents'),
    root: optionValue(args, '--root'),
    force: args.includes('--force'),
  }
}

async function interactiveInstallOptions(args: string[], options: CliOptions): Promise<CliOptions> {
  if (process.env.CSD_NON_INTERACTIVE === '1' || !input.isTTY || !output.isTTY || args.includes('--agents')) return options
  const readline = createInterface({ input, output })
  try {
    const scopeAnswer = await readline.question('Install scope [global/project] (global): ')
    const agentAnswer = await readline.question('Agents [all or comma-separated ids] (all): ')
    const scope = scopeAnswer.trim() === '' ? options.scope : scopeAnswer.trim() as Scope
    if (scope !== 'global' && scope !== 'project') throw new Error('Scope must be global or project')
    return { ...options, scope, agents: agentAnswer.trim() === '' ? 'all' : agentAnswer.trim() }
  } finally {
    readline.close()
  }
}

async function main(argv: string[]): Promise<number> {
  const [command = 'install', ...args] = argv
  if (command === '--help' || command === '-h' || command === 'help') {
    process.stdout.write(usage())
    return 0
  }
  if (command === '--version' || command === '-v') {
    process.stdout.write(`${PACKAGE_VERSION}\n`)
    return 0
  }
  if (command === 'list') {
    process.stdout.write(usage())
    return 0
  }
  if (command === 'discover') {
    const root = optionValue(args, '--root')
    if (!root) throw new Error('discover requires --root <project>')
    const discovery = await discoverContext(root)
    process.stdout.write(JSON.stringify({ ...discovery, human_summary: describeDiscovery(discovery) }, null, 2) + '\n')
    return 0
  }
  if (command === 'modules') {
    const root = optionValue(args, '--root')
    if (!root) throw new Error('modules requires --root <project>')
    const preview = await moduleContextPreview(root)
    if (args.includes('--yes') || args.includes('--decline')) {
      if (args.includes('--dry-run')) {
        process.stdout.write(JSON.stringify(preview, null, 2) + '\n')
        return preview.conflicts.length > 0 ? 1 : 0
      }
      if (preview.conflicts.length > 0) {
        process.stdout.write(JSON.stringify(preview, null, 2) + '\n')
        return 1
      }
      const report = await moduleContextApply(root, preview.token, true, args.includes('--decline'))
      process.stdout.write(JSON.stringify(report, null, 2) + '\n')
      return report.conflicts.length > 0 ? 1 : 0
    }
    process.stdout.write(JSON.stringify(args.includes('--preview') ? preview : preview.discovery.module_context, null, 2) + '\n')
    return preview.conflicts.length > 0 ? 1 : 0
  }
  if (command === 'bootstrap') {
    const root = optionValue(args, '--root')
    if (!root) throw new Error('bootstrap requires --root <project>')
    const preview = await bootstrapPreview(root)
    process.stdout.write(JSON.stringify(preview, null, 2) + '\n')
    if (preview.discovery.status === 'resolved' || preview.conflicts.length > 0 || args.includes('--dry-run')) return preview.conflicts.length > 0 ? 1 : 0
    let confirmed = args.includes('--yes') || args.includes('--force')
    if (!confirmed && input.isTTY && output.isTTY && process.env.CSD_NON_INTERACTIVE !== '1') {
      const readline = createInterface({ input, output })
      try { confirmed = (await readline.question('Type yes to apply this preview: ')).trim() === 'yes' }
      finally { readline.close() }
    }
    if (!confirmed) {
      process.stdout.write('No files were written. Review the preview, then rerun with --yes to apply.\n')
      return 0
    }
    const report = await bootstrapApply(root, preview.token, true)
    process.stdout.write(JSON.stringify(report, null, 2) + '\n')
    return report.conflicts.length > 0 ? 1 : 0
  }
  if (command === 'mcp') {
    const root = optionValue(args, '--root')
    const { startCsdServer } = await import('./mcp/server.js')
    await startCsdServer(root ? resolve(root) : undefined)
    return 0
  }

  let options = parseOptions(args)
  if (command === 'install') {
    options = await interactiveInstallOptions(args, options)
    const report = await install({
      scope: options.scope,
      agents: parseAgents(options.agents),
      root: options.root,
      force: options.force,
    })
    process.stdout.write(`Installed ${PACKAGE_NAME}@${PACKAGE_VERSION} for ${report.agents.join(', ')} in ${report.root}\n`)
    if (report.skipped.length > 0) process.stdout.write(`Already present: ${report.skipped.join(', ')}\n`)
    for (const warning of report.warnings) process.stdout.write(`Warning: ${warning}\n`)
    return 0
  }
  if (command === 'update') {
    if (args.includes('--context')) {
      if (!options.root) throw new Error('update --context requires --root <project>')
      const preview = await contextUpdatePreview(options.root)
      process.stdout.write(JSON.stringify(preview, null, 2) + '\n')
      if (preview.discovery.status !== 'resolved' || (preview.conflicts.length > 0 && !options.force) || args.includes('--dry-run')) return preview.conflicts.length > 0 ? 1 : 0
      let confirmed = args.includes('--yes')
      if (!confirmed && input.isTTY && output.isTTY && process.env.CSD_NON_INTERACTIVE !== '1') {
        const readline = createInterface({ input, output })
        try { confirmed = (await readline.question('Type yes to apply this context update: ')).trim() === 'yes' }
        finally { readline.close() }
      }
      if (!confirmed) {
        process.stdout.write('No files were written. Review the preview, then rerun with --yes to apply.\n')
        return 0
      }
      const contextReport = await contextUpdateApply(options.root, preview.token, true, options.force)
      process.stdout.write(JSON.stringify(contextReport, null, 2) + '\n')
      return contextReport.conflicts.length > 0 ? 1 : 0
    }
    const current = await inspect(options.scope, options.root)
    if (!current.lock) throw new Error('CSD is not installed in this scope')
    const packagePreview = await updatePreview(options.scope, options.root, options.force)
    if (args.includes('--dry-run')) {
      process.stdout.write(JSON.stringify(packagePreview, null, 2) + '\n')
      return packagePreview.conflicts.length > 0 ? 1 : 0
    }
    const report = await update(options.scope, options.root, options.force)
    process.stdout.write(`Updated ${PACKAGE_NAME}@${PACKAGE_VERSION} in ${report.root}\n`)
    for (const warning of report.warnings) process.stdout.write(`Warning: ${warning}\n`)
    return 0
  }
  if (command === 'remove') {
    const removed = await remove(options.scope, options.root, options.force)
    process.stdout.write(`Removed ${removed.length} CSD files\n`)
    return 0
  }
  if (command === 'doctor') {
    const report = await inspect(options.scope, options.root)
    if (report.problems.length > 0) {
      process.stdout.write(`${report.problems.join('\n')}\n`)
      return 1
    }
    process.stdout.write(`CSD is healthy (${report.lock?.version})\n`)
    return 0
  }
  throw new Error(`Unknown command: ${command}\n\n${usage()}`)
}

main(process.argv.slice(2)).then((code) => {
  process.exitCode = code
}).catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
