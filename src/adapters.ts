import type { Adapter, AgentId } from './types.js'

export const ADAPTERS: readonly Adapter[] = [
  {
    id: 'oas',
    label: 'Open Agent Skills',
    activation: 'Use the installed `csd` skill according to this host\'s native skill invocation.',
    skillPath: '.agents/skills/csd/SKILL.md',
  },
  {
    id: 'codex',
    label: 'Codex',
    activation: 'Invoke with `$csd` (Codex uses `$` for explicit skill invocation).',
    skillPath: '.agents/skills/csd/SKILL.md',
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    activation: 'Invoke with `/csd`.',
    skillPath: '.claude/skills/csd/SKILL.md',
    commandPath: '.claude/commands/csd.md',
    commandFormat: 'markdown',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    activation: 'Invoke with `/csd`.',
    skillPath: '.cursor/skills/csd/SKILL.md',
    commandPath: '.cursor/commands/csd.md',
    commandFormat: 'markdown',
  },
  {
    id: 'copilot',
    label: 'GitHub Copilot',
    activation: 'Select the `csd` custom agent with `/agent`, or ask the host to use CSD.',
    skillPath: '.agents/skills/csd/SKILL.md',
    commandPath: '.github/agents/csd.md',
    globalCommandPath: '.copilot/agents/csd.md',
    commandFormat: 'markdown',
  },
  {
    id: 'gemini',
    label: 'Gemini CLI',
    activation: 'Invoke with `/csd`.',
    skillPath: '.agents/skills/csd/SKILL.md',
    globalSkillPath: '.gemini/config/skills/csd/SKILL.md',
    commandPath: '.gemini/commands/csd.toml',
    commandFormat: 'toml',
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    activation: 'Invoke with `/csd`.',
    skillPath: '.agents/skills/csd/SKILL.md',
    commandPath: '.opencode/commands/csd.md',
    globalSkillPath: '.config/opencode/skills/csd/SKILL.md',
    globalCommandPath: '.config/opencode/commands/csd.md',
    commandFormat: 'markdown',
  },
]

const adapterById = new Map(ADAPTERS.map((adapter) => [adapter.id, adapter]))

export function getAdapter(id: AgentId): Adapter {
  const adapter = adapterById.get(id)
  if (!adapter) throw new Error(`Unsupported agent: ${id}`)
  return adapter
}

export function parseAgents(value: string | undefined): AgentId[] {
  if (!value || value.trim() === '' || value.trim() === 'all') return ADAPTERS.map((adapter) => adapter.id)
  const requested = value.split(',').map((agent) => agent.trim()).filter(Boolean)
  const invalid = requested.filter((agent): agent is string => !adapterById.has(agent as AgentId))
  if (invalid.length > 0) throw new Error(`Unsupported agent(s): ${invalid.join(', ')}`)
  return [...new Set(requested as AgentId[])]
}

export function activationTable(): string {
  return ADAPTERS.map((adapter) => `${adapter.id}: ${adapter.activation}`).join('\n')
}
