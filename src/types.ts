export type Scope = 'global' | 'project'

export type AgentId =
  | 'oas'
  | 'codex'
  | 'claude-code'
  | 'cursor'
  | 'copilot'
  | 'gemini'
  | 'opencode'

export interface InstallOptions {
  scope: Scope
  agents: AgentId[]
  root: string | undefined
  force: boolean | undefined
}

export interface InstalledFile {
  path: string
  sha256: string
}

export interface LockFile {
  schemaVersion: 1
  package: string
  version: string
  scope: Scope
  installedAt: string
  agents: AgentId[]
  files: InstalledFile[]
}

export interface Adapter {
  id: AgentId
  label: string
  activation: string
  skillPath: string
  globalSkillPath?: string
  commandPath?: string
  globalCommandPath?: string
  commandFormat?: 'markdown' | 'toml'
}

export interface PlannedFile {
  relativePath: string
  content: string
}

export interface OperationReport {
  scope: Scope
  root: string
  agents: AgentId[]
  files: InstalledFile[]
  skipped: string[]
  warnings: string[]
}
