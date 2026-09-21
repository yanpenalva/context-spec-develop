import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const skillRoot = join(root, 'skill', 'csd')
const files = []
async function visit(current) {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const path = join(current, entry.name)
    if (entry.isDirectory()) await visit(path)
    else if (entry.isFile()) files.push(path)
  }
}
await visit(skillRoot)
files.sort()
const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8')
const frontmatter = Object.fromEntries([...skill.matchAll(/^([a-zA-Z]+):\s*(.+)$/gm)].map((match) => [match[1], match[2]]))
frontmatter.version = /^\s+version:\s*(.+)$/m.exec(skill)?.[1] ?? 'unknown'
const entries = []
for (const path of files) {
  const content = await readFile(path)
  entries.push({ path: path.slice(skillRoot.length + 1), sha256: createHash('sha256').update(content).digest('hex'), bytes: content.byteLength })
}
const registry = {
  schemaVersion: 1,
  compatibility: {
    nativeSlashCommand: ['claude-code', 'cursor', 'gemini', 'opencode'],
    explicitSkill: ['oas', 'codex'],
    customAgent: ['copilot'],
  },
  skills: [{ name: frontmatter.name, description: frontmatter.description, license: frontmatter.license, version: frontmatter.version, files: entries }],
}
const destination = join(root, 'registry', 'skills.json')
await mkdir(dirname(destination), { recursive: true })
await writeFile(destination, `${JSON.stringify(registry, null, 2)}\n`)
