#!/usr/bin/env node
import { activationTable, parseAgents } from './adapters.js'
import { bootstrap, inspect, install, PACKAGE_NAME, PACKAGE_VERSION, remove } from './installer.js'
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
  return `CSD ${PACKAGE_VERSION}\n\nUsage:\n  csd install [--agents <ids>] [--scope global|project] [--root <path>] [--force]\n  csd update [--scope global|project] [--root <path>]\n  csd remove [--scope global|project] [--root <path>] [--force]\n  csd list\n  csd doctor [--scope global|project] [--root <path>]\n  csd bootstrap --root <project> [--force]\n\nAgents:\n${activationTable()}\n`
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
  if (command === 'bootstrap') {
    const root = optionValue(args, '--root')
    if (!root) throw new Error('bootstrap requires --root <project>')
    const report = await bootstrap(root, args.includes('--force'))
    process.stdout.write(`CSD bootstrap complete: ${report.created.length} created, ${report.skipped.length} skipped\n`)
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
    const current = await inspect(options.scope, options.root)
    if (!current.lock) throw new Error('CSD is not installed in this scope')
    const report = await install({ scope: options.scope, agents: current.lock.agents, root: options.root, force: true })
    process.stdout.write(`Updated ${PACKAGE_NAME}@${PACKAGE_VERSION} in ${report.root}\n`)
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

main(process.argv.slice(2)).catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
