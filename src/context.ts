import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, readdir, realpath } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { atomicWrite, sha256 } from './fs.js'

export type ContextLayout = string
export type DiscoveryStatus = 'resolved' | 'bootstrap_required' | 'conflict' | 'invalid'
export type MarkerRule = { allOf?: string[]; anyOf?: string[][] }
export type ModuleContextDecision = 'pending' | 'enabled' | 'declined'
export type ModuleContextStatus = 'found' | 'missing' | 'declined' | 'disabled' | 'invalid'
export interface ContextConfig {
  enabledAdapters: ContextLayout[]
  adapterPrecedence: ContextLayout[]
  resolveMultipleCandidatesSilently: boolean
  markerRules: Partial<Record<ContextLayout, MarkerRule>>
  canonicalLayout: ContextLayout
  protectedPaths: string[]
  optionalFrameworkIntegrations: string[]
  onboardingPolicy: 'placeholder-only' | 'never'
  migrationPolicy: 'explicit-only' | 'never'
  dryRun: boolean
  moduleContext: ModuleContextSettings
}
interface ModuleContextSettings {
  enabled?: boolean
  decision?: ModuleContextDecision
  prompt_policy?: 'once' | 'never'
  search_roots?: string[]
}
export interface ContextPaths {
  root: string
  index: string
  workflow: string
  routing: string
  work: string
  templates: string
  scripts: string
  onboarding: string | undefined
  onboardingSources: string[]
  config: string
  validator: string | undefined
}
export interface ContextCandidate {
  layout: ContextLayout
  path: string
  valid: boolean
  markers: { marker: string; exists: boolean; kind: 'file' | 'directory' }[]
  missing: string[]
  error?: string
}
export interface DiscoveryResult {
  status: DiscoveryStatus
  mode: 'native' | 'compatibility' | 'bootstrap' | 'invalid'
  root: string
  layout?: ContextLayout
  paths?: ContextPaths
  capabilities: { index: boolean; workflow: boolean; routing: boolean; work: boolean; templates: boolean; scripts: boolean; onboarding: boolean; validator: boolean }
  markerEvidence: ContextCandidate[]
  candidates: ContextCandidate[]
  selected?: ContextCandidate
  missing: string[]
  conflicts: string[]
  protectedPaths: string[]
  created: string[]
  modified: string[]
  migration_required: boolean
  onboarding_required: boolean
  precedence_applied: boolean
  warnings: string[]
  module_context?: ModuleContextDiscovery
}
export interface ContextAdapter {
  id: ContextLayout
  root: string
  mode: 'native' | 'compatibility'
  markerRules: MarkerRule
  enabledByDefault?: boolean
  resolve: (repositoryRoot: string) => Promise<{ paths: ContextPaths; missing: string[] }>
  mapBootstrapPath: (sourceRelativePath: string) => string
  transformTemplate: (content: string) => string
}
export function describeDiscovery(result: DiscoveryResult): string {
  if (result.status === 'invalid') return 'Context discovery is invalid. Action: stop; no files will be created or modified. Conflicts: ' + result.conflicts.join('; ')
  if (result.status === 'conflict') return 'Multiple valid context layouts detected. Action: stop and request resolution. No files will be created or modified. Candidates: ' + result.candidates.filter((candidate) => candidate.valid).map((candidate) => candidate.path).sort().join(', ')
  if (result.status === 'bootstrap_required') return 'No valid context layout detected. Action: bootstrap preview required. No files will be created before confirmation.'
  const label = result.layout ?? result.paths?.root ?? 'unknown'
  const action = result.mode === 'native' ? 'continue using existing context' : 'no-op; continue using existing context'
  const onboarding = result.capabilities.onboarding ? 'optional; existing project workflow available' : 'optional; no onboarding prompt available'
  const moduleContext = result.module_context
  const moduleSummary = moduleContext === undefined
    ? 'Module documentation: not inspected until a layout is selected'
    : moduleContext.status === 'missing' && moduleContext.needs_prompt
      ? 'Module documentation: none found; explicit scaffold decision required'
      : 'Module documentation: ' + moduleContext.status + (moduleContext.module_files.length > 0 ? ' (' + moduleContext.module_files.length + ' file(s))' : '')
  return ['Detected context layout: ' + label, 'Mode: ' + result.mode, 'Action: ' + action, 'Migration: not required', 'Onboarding: ' + onboarding, moduleSummary].join(String.fromCharCode(10))
}

export interface FrameworkIntegration {
  id: string
  detect?: (root: string, discovery: DiscoveryResult) => Promise<{ detected?: boolean; warnings?: string[]; protectedPaths?: string[]; validation?: unknown; onboardingHint?: string }>
}
export interface DiscoveryOptions {
  integrations?: FrameworkIntegration[]
}

export interface ModuleContextDiscovery {
  status: ModuleContextStatus
  decision: ModuleContextDecision
  enabled: boolean
  prompt_policy: 'once' | 'never'
  search_roots: string[]
  existing_roots: string[]
  structure_files: string[]
  module_files: string[]
  scaffold_root: string
  config_path: string
  decision_path: string
  needs_prompt: boolean
  warnings: string[]
}

export interface ModuleContextFilePlan {
  path: string
  action: 'create' | 'update' | 'skip' | 'conflict'
  sha256?: string
  reason?: string
}

export interface ModuleContextPlan {
  root: string
  action: 'create' | 'decline' | 'noop'
  discovery: DiscoveryResult
  files: ModuleContextFilePlan[]
  conflicts: string[]
  token: string
  summary: string
}

export interface ContextUpdateFilePlan {
  path: string
  action: 'create' | 'update' | 'update-version' | 'skip' | 'conflict' | 'stale' | 'protected'
  sha256?: string
  reason?: string
}

export interface ContextUpdatePlan {
  root: string
  discovery: DiscoveryResult
  files: ContextUpdateFilePlan[]
  conflicts: string[]
  token: string
  summary: string
}

const LAYOUTS: ContextLayout[] = ['.context', '.ai', '.agents', 'docs/context', 'context']
const DEFAULT_PROTECTED = ['.git', 'node_modules', 'vendor', 'dist', 'build', 'coverage', 'generated', 'registry', 'catalog']
const DEFAULT_MODULE_CONTEXT_ROOTS = [
  '.context/project/modules',
  '.context/project/domains',
  '.context/project/bounded-contexts',
  '.context/modules',
  '.context/domains',
  '.ai/modules',
  '.ai/domains',
  '.ai/bounded-contexts',
]
const MODULE_STRUCTURE_FILES = new Set(['README.md', 'INDEX.md', '_module-template.md'])
const DEFAULTS: ContextConfig = {
  enabledAdapters: [...LAYOUTS],
  adapterPrecedence: [...LAYOUTS],
  resolveMultipleCandidatesSilently: false,
  markerRules: {},
  canonicalLayout: '.context',
  protectedPaths: [...DEFAULT_PROTECTED],
  optionalFrameworkIntegrations: [],
  onboardingPolicy: 'placeholder-only',
  migrationPolicy: 'explicit-only',
  dryRun: true,
  moduleContext: { enabled: true, decision: 'pending', prompt_policy: 'once' },
}
const EMPTY_CAPABILITIES = { index: false, workflow: false, routing: false, work: false, templates: false, scripts: false, onboarding: false, validator: false }

const MODULE_README = `# Module Documentation

This directory contains optional documentation for project domains or modules.

Keep one Markdown file per meaningful domain. Describe current behavior and
evidence, not an imagined architecture. Keep implementation details linked to
source files and mark unknown facts as NOT FOUND.

The framework does not require a specific language, framework or module style.
Use this context when a task crosses a domain boundary or needs business rules,
interfaces, dependencies, permissions, persistence or verification details.

See _module-template.md for a generic starting point.
`

const MODULE_TEMPLATE = `# Module Documentation Template

## Name and purpose

NOT FOUND

## Boundary

NOT FOUND

## Responsibilities

NOT FOUND

## Entry points and public interfaces

NOT FOUND

## Data and persistence

NOT FOUND

## Business rules and invariants

NOT FOUND

## Dependencies and integrations

NOT FOUND

## Security and permissions

NOT FOUND

## Testing and observability

NOT FOUND

## Known gaps and evidence

NOT FOUND
`
const ADAPTER_REGISTRY = new Map<ContextLayout, ContextAdapter>()

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validModuleContextSettings(value: unknown): value is ModuleContextSettings {
  if (!isRecord(value)) return false
  if (Object.keys(value).some((key) => !['enabled', 'decision', 'prompt_policy', 'search_roots'].includes(key))) return false
  if (value['enabled'] !== undefined && typeof value['enabled'] !== 'boolean') return false
  if (value['decision'] !== undefined && (typeof value['decision'] !== 'string' || !['pending', 'enabled', 'declined'].includes(value['decision']))) return false
  if (value['prompt_policy'] !== undefined && (typeof value['prompt_policy'] !== 'string' || !['once', 'never'].includes(value['prompt_policy']))) return false
  if (value['search_roots'] !== undefined && (!Array.isArray(value['search_roots']) || value['search_roots'].length > 16 || !value['search_roots'].every((path) => safeRelativePath(path) && path.length <= 256))) return false
  return true
}

function safeRelativePath(value: unknown, max = 512): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > max || value.startsWith('/') || value.includes('\\') || /[:*?\x00-\x1f\x7f]/.test(value)) return false
  const normalized = value.endsWith('/') ? value.slice(0, -1) : value
  const parts = normalized.split('/')
  return parts.length > 0 && parts.every((part) => part !== '' && part !== '.' && part !== '..')
}

export function normalizeRepositoryPath(value: string): string {
  return value.split(/[\\/]+/).filter(Boolean).join('/')
}

async function pathInfo(root: string, relativePath: string): Promise<{ exists: boolean; kind?: 'file' | 'directory'; unsafe?: string }> {
  if (!safeRelativePath(relativePath)) return { exists: false, unsafe: 'unsafe repository-relative path: ' + relativePath }
  const parts = relativePath.split('/').filter(Boolean)
  let current = root
  for (let index = 0; index < parts.length; index += 1) {
    current = join(current, parts[index] as string)
    let stat
    try {
      stat = await lstat(current)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { exists: false }
      return { exists: false, unsafe: 'unable to inspect path component' }
    }
    if (stat.isSymbolicLink()) return { exists: false, unsafe: 'symlink path component is not allowed: ' + relativePath }
    if (index < parts.length - 1 && !stat.isDirectory()) return { exists: false, unsafe: 'non-directory path component: ' + relativePath }
    if (index === parts.length - 1) {
      if (stat.isDirectory()) return { exists: true, kind: 'directory' }
      if (stat.isFile()) return { exists: true, kind: 'file' }
      return { exists: true }
    }
  }
  return { exists: false }
}

export async function inspectContextPath(root: string, relativePath: string): Promise<{ exists: boolean; kind?: 'file' | 'directory'; unsafe?: string }> {
  if (!safeRelativePath(relativePath)) return { exists: false, unsafe: 'unsafe repository-relative path: ' + relativePath }
  return pathInfo(await realpath(resolve(root)), relativePath)
}

export async function readContextFile(root: string, relativePath: string): Promise<string> {
  return readSafe(await realpath(resolve(root)), relativePath)
}

export async function writeContextFile(root: string, relativePath: string, content: string): Promise<void> {
  const resolved = await realpath(resolve(root))
  const config = await loadConfig(resolved)
  if (protectedTarget(relativePath, config.protectedPaths)) throw new Error('Refusing to write a protected context path: ' + relativePath)
  await writeSafe(resolved, relativePath, content)
}

async function readSafe(root: string, relativePath: string): Promise<string> {
  const info = await pathInfo(root, relativePath)
  if (info.unsafe) throw new Error(info.unsafe)
  if (!info.exists || info.kind !== 'file') throw new Error('Expected a regular file: ' + relativePath)
  return readFile(join(root, relativePath), 'utf8')
}

async function writeSafe(root: string, relativePath: string, content: string): Promise<void> {
  const parts = relativePath.split('/').filter(Boolean)
  let current = root
  for (const part of parts.slice(0, -1)) {
    current = join(current, part)
    const info = await pathInfo(root, relative(root, current).split(sep).join('/'))
    if (info.unsafe) throw new Error(info.unsafe)
    if (!info.exists) await mkdir(current)
    else if (info.kind !== 'directory') throw new Error('Non-directory path component: ' + relativePath)
  }
  const info = await pathInfo(root, relativePath)
  if (info.unsafe) throw new Error(info.unsafe)
  await atomicWrite(join(root, relativePath), content)
}

function markerRule(layout: ContextLayout): MarkerRule {
  if (layout === '.context') return { allOf: ['INDEX.md'], anyOf: [['workflow.md', 'context-routing/', 'work/']] }
  if (layout === '.ai') return { allOf: ['README.md'], anyOf: [['workflow.md', 'context-routing/', 'tasks/']] }
  if (layout === '.agents') return { anyOf: [['INDEX.md', 'context/', 'context.json']] }
  if (layout === 'docs/context') return { allOf: ['INDEX.md'], anyOf: [['workflow.md', 'routing/', 'context-routing/', 'work/']] }
  return { anyOf: [['INDEX.md', 'README.md'], ['workflow.md', 'routing/', 'context-routing/', 'work/']] }
}

function layoutRoot(layout: ContextLayout): string { return layout }

function isDirectoryMarker(marker: string): boolean { return marker.endsWith('/') }

function combineRule(layout: ContextLayout, configured: MarkerRule | undefined): MarkerRule {
  return configured ?? markerRule(layout)
}

function validMarkerRule(value: unknown): value is MarkerRule {
  if (!isRecord(value)) return false
  for (const key of Object.keys(value)) if (!['allOf', 'anyOf'].includes(key)) return false
  if (value['allOf'] !== undefined && (!Array.isArray(value['allOf']) || !value['allOf'].every((item) => safeRelativePath(item)))) return false
  if (value['anyOf'] !== undefined) {
    if (!Array.isArray(value['anyOf'])) return false
    if (!value['anyOf'].every((group) => Array.isArray(group) && group.length > 0 && group.every((item) => safeRelativePath(item)))) return false
  }
  return value['allOf'] !== undefined || value['anyOf'] !== undefined
}

function invalidResult(root: string, message: string, candidates: ContextCandidate[] = []): DiscoveryResult {
  return {
    status: 'invalid', mode: 'invalid', root: '.', capabilities: { ...EMPTY_CAPABILITIES },
    markerEvidence: candidates, candidates, missing: [], conflicts: [message],
    protectedPaths: [], created: [], modified: [], migration_required: false,
    onboarding_required: false, precedence_applied: false, warnings: [],
  }
}

async function loadConfig(root: string): Promise<ContextConfig> {
  const info = await pathInfo(root, 'csd.config.json')
  if (info.unsafe) throw new Error(info.unsafe)
  if (!info.exists) {
    const defaults = [...ADAPTER_REGISTRY.values()].filter((adapter) => LAYOUTS.includes(adapter.id as typeof LAYOUTS[number]) || adapter.enabledByDefault).map((adapter) => adapter.id)
    return { ...DEFAULTS, enabledAdapters: defaults, adapterPrecedence: [...defaults], protectedPaths: [...DEFAULT_PROTECTED] }
  }
  if (info.kind !== 'file') throw new Error('csd.config.json must be a regular file')
  const stat = await lstat(join(root, 'csd.config.json'))
  if (stat.size > 64 * 1024) throw new Error('csd.config.json exceeds 64 KiB')
  let parsed: unknown
  try { parsed = JSON.parse(await readSafe(root, 'csd.config.json')) } catch (error) { throw new Error('Invalid csd.config.json: ' + (error instanceof Error ? error.message : String(error))) }
  if (!isRecord(parsed) || Object.keys(parsed).some((key) => key !== 'contextDiscovery') || !isRecord(parsed['contextDiscovery'])) throw new Error('csd.config.json must contain only a contextDiscovery object')
  const raw = parsed['contextDiscovery'] as Record<string, unknown>
  const knownAdapters = new Set(ADAPTER_REGISTRY.keys())
  const defaultAdapters = [...ADAPTER_REGISTRY.values()].filter((adapter) => LAYOUTS.includes(adapter.id as typeof LAYOUTS[number]) || adapter.enabledByDefault).map((adapter) => adapter.id)
  const allowed = ['enabledAdapters', 'adapterPrecedence', 'resolveMultipleCandidatesSilently', 'markerRules', 'canonicalLayout', 'protectedPaths', 'optionalFrameworkIntegrations', 'onboardingPolicy', 'migrationPolicy', 'dryRun', 'moduleContext']
  const checks = [
    ['enabledAdapters', raw['enabledAdapters'] === undefined || Array.isArray(raw['enabledAdapters'])],
    ['adapterPrecedence', raw['adapterPrecedence'] === undefined || Array.isArray(raw['adapterPrecedence'])],
    ['resolveMultipleCandidatesSilently', raw['resolveMultipleCandidatesSilently'] === undefined || typeof raw['resolveMultipleCandidatesSilently'] === 'boolean'],
    ['markerRules', raw['markerRules'] === undefined || isRecord(raw['markerRules'])],
    ['canonicalLayout', raw['canonicalLayout'] === undefined || typeof raw['canonicalLayout'] === 'string'],
    ['protectedPaths', raw['protectedPaths'] === undefined || Array.isArray(raw['protectedPaths'])],
    ['optionalFrameworkIntegrations', raw['optionalFrameworkIntegrations'] === undefined || Array.isArray(raw['optionalFrameworkIntegrations'])],
    ['onboardingPolicy', raw['onboardingPolicy'] === undefined || typeof raw['onboardingPolicy'] === 'string'],
    ['migrationPolicy', raw['migrationPolicy'] === undefined || typeof raw['migrationPolicy'] === 'string'],
    ['dryRun', raw['dryRun'] === undefined || typeof raw['dryRun'] === 'boolean'],
    ['moduleContext', raw['moduleContext'] === undefined || validModuleContextSettings(raw['moduleContext'])],
  ] as const
  for (const [key, valid] of checks) if (!valid) throw new Error(key + ' has an invalid type')
  if (Object.keys(raw).some((key) => !allowed.includes(key))) throw new Error('Unknown contextDiscovery configuration field')
  const config: ContextConfig = {
    ...DEFAULTS,
    enabledAdapters: Array.isArray(raw['enabledAdapters']) ? raw['enabledAdapters'] as ContextLayout[] : [...defaultAdapters],
    adapterPrecedence: Array.isArray(raw['adapterPrecedence']) ? raw['adapterPrecedence'] as ContextLayout[] : [...defaultAdapters],
    resolveMultipleCandidatesSilently: raw['resolveMultipleCandidatesSilently'] === undefined ? false : raw['resolveMultipleCandidatesSilently'] as boolean,
    markerRules: isRecord(raw['markerRules']) ? raw['markerRules'] as Partial<Record<ContextLayout, MarkerRule>> : {},
    canonicalLayout: raw['canonicalLayout'] as ContextLayout ?? '.context',
    protectedPaths: Array.isArray(raw['protectedPaths']) ? raw['protectedPaths'] as string[] : [...DEFAULT_PROTECTED],
    optionalFrameworkIntegrations: Array.isArray(raw['optionalFrameworkIntegrations']) ? raw['optionalFrameworkIntegrations'] as string[] : [],
    onboardingPolicy: raw['onboardingPolicy'] as ContextConfig['onboardingPolicy'] ?? 'placeholder-only',
    migrationPolicy: raw['migrationPolicy'] as ContextConfig['migrationPolicy'] ?? 'explicit-only',
    dryRun: raw['dryRun'] === undefined ? true : raw['dryRun'] as boolean,
    moduleContext: raw['moduleContext'] === undefined ? { ...DEFAULTS.moduleContext } : raw['moduleContext'] as ModuleContextSettings,
  }
  if (!config.enabledAdapters.length || new Set(config.enabledAdapters).size !== config.enabledAdapters.length || !config.enabledAdapters.every((item) => knownAdapters.has(item))) throw new Error('enabledAdapters contains an unsupported layout')
  if (!config.adapterPrecedence.every((item) => knownAdapters.has(item)) || new Set(config.adapterPrecedence).size !== config.adapterPrecedence.length) throw new Error('adapterPrecedence contains an unsupported or duplicate layout')
  if (!knownAdapters.has(config.canonicalLayout)) throw new Error('canonicalLayout is unsupported')
  if (!config.enabledAdapters.includes(config.canonicalLayout)) throw new Error('canonicalLayout must be enabled')
  if (typeof config.resolveMultipleCandidatesSilently !== 'boolean' || typeof config.dryRun !== 'boolean') throw new Error('Boolean contextDiscovery settings must be booleans')
  if (!['placeholder-only', 'never'].includes(config.onboardingPolicy) || !['explicit-only', 'never'].includes(config.migrationPolicy)) throw new Error('Invalid onboardingPolicy or migrationPolicy')
  if (!Array.isArray(config.protectedPaths) || !config.protectedPaths.every((path) => safeRelativePath(path))) throw new Error('protectedPaths contains an unsafe path')
  if (!Array.isArray(config.optionalFrameworkIntegrations) || !config.optionalFrameworkIntegrations.every((id) => typeof id === 'string' && /^[a-z0-9][a-z0-9._-]{0,63}$/.test(id))) throw new Error('optionalFrameworkIntegrations contains an invalid id')
  if (!isRecord(raw['markerRules'] ?? {})) throw new Error('markerRules must be an object')
  for (const [layout, rule] of Object.entries(config.markerRules)) {
    if (!knownAdapters.has(layout) || !validMarkerRule(rule)) throw new Error('markerRules contains an invalid rule for ' + layout)
    for (const marker of [...(rule.allOf ?? []), ...(rule.anyOf ?? []).flat()]) {
      if (!safeRelativePath(marker) || marker.length > 512) throw new Error('markerRules contains an unsafe marker')
    }
  }
  return config
}

async function evaluateMarker(root: string, candidateRoot: string, marker: string): Promise<{ exists: boolean; kind: 'file' | 'directory'; unsafe?: string }> {
  const directory = isDirectoryMarker(marker)
  const clean = directory ? marker.slice(0, -1) : marker
  const info = await pathInfo(root, candidateRoot + '/' + clean)
  return { exists: info.exists && info.kind === (directory ? 'directory' : 'file'), kind: directory ? 'directory' : 'file', ...(info.unsafe ? { unsafe: info.unsafe } : {}) }
}

async function evaluateCandidate(root: string, adapter: ContextAdapter, rules: Partial<Record<ContextLayout, MarkerRule>>): Promise<ContextCandidate> {
  const layout = adapter.id
  const candidateRoot = adapter.root
  const candidateInfo = await pathInfo(root, candidateRoot)
  if (candidateInfo.unsafe) return { layout, path: candidateRoot, valid: false, markers: [], missing: [], error: candidateInfo.unsafe }
  if (candidateInfo.exists && candidateInfo.kind !== 'directory') return { layout, path: candidateRoot, valid: false, markers: [], missing: [], error: 'adapter root is not a directory' }
  const rule = rules[layout] ?? adapter.markerRules
  const markerNames = new Set([...(rule.allOf ?? []), ...(rule.anyOf ?? []).flat()])
  const markers: { marker: string; exists: boolean; kind: 'file' | 'directory' }[] = []
  for (const marker of [...markerNames].sort()) {
    const result = await evaluateMarker(root, candidateRoot, marker)
    markers.push({ marker, exists: result.exists, kind: result.kind })
    if (result.unsafe) return { layout, path: candidateRoot, valid: false, markers, missing: [], error: result.unsafe }
  }
  const allOk = (rule.allOf ?? []).every((marker) => markers.find((item) => item.marker === marker)?.exists)
  const anyOk = (rule.anyOf ?? []).every((group) => group.some((marker) => markers.find((item) => item.marker === marker)?.exists))
  const missing = [...(rule.allOf ?? []).filter((marker) => !markers.find((item) => item.marker === marker)?.exists)]
  for (const group of rule.anyOf ?? []) if (!group.some((marker) => markers.find((item) => item.marker === marker)?.exists)) missing.push(group.join(' or '))
  return { layout, path: candidateRoot, valid: candidateInfo.exists && allOk && anyOk, markers, missing }
}

async function firstExisting(root: string, candidates: string[], kind?: 'file' | 'directory'): Promise<string | undefined> {
  for (const candidate of candidates) {
    const info = await pathInfo(root, candidate)
    if (info.unsafe) throw new Error(info.unsafe)
    if (info.exists && (!kind || info.kind === kind)) return candidate
  }
  return undefined
}

function normalizedPaths(layout: ContextLayout, root: string, found: Map<string, string | undefined>): ContextPaths {
  const base = layout
  const choose = (key: string, fallback: string) => (found.get(key) ?? base + '/' + fallback).replace(/\/+$/, '')
  let index = choose('index', layout === '.ai' ? 'README.md' : layout === '.agents' ? 'INDEX.md' : 'INDEX.md')
  if (layout === '.agents' && !found.get('index')) index = base + '/context/INDEX.md'
  return {
    root: base,
    index,
    workflow: choose('workflow', layout === '.agents' ? 'context/workflow.md' : 'workflow.md'),
    routing: choose('routing', layout === '.agents' ? 'context/context-routing/' : layout === '.context' ? 'context-routing/' : 'routing/'),
    work: choose('work', layout === '.ai' ? 'tasks/' : layout === '.agents' ? 'work/' : 'work/'),
    templates: choose('templates', layout === '.ai' ? 'tasks/templates/' : 'templates/'),
    scripts: choose('scripts', 'scripts/'),
    onboarding: found.get('onboarding') ?? (layout === '.ai' ? found.get('promptsBase') ?? found.get('workflow') : undefined),
    onboardingSources: layout === '.ai' ? [found.get('workflow'), found.get('promptsBase')].filter((path): path is string => path !== undefined) : [found.get('onboarding')].filter((path): path is string => path !== undefined),
    config: choose('config', 'config.json'),
    validator: found.get('validator'),
  }
}

function patternCharSet(source: string): Set<string> | undefined {
  const chars = new Set<string>()
  let input = source
  let negate = false
  if (input.startsWith('^')) { negate = true; input = input.slice(1) }
  for (let index = 0; index < input.length; index += 1) {
    const first = input[index] as string
    if (first === '\\' || first === ']' || first === '[') return undefined
    const next = input[index + 1]
    if (next === '-') {
      const last = input[index + 2]
      if (!last || first.charCodeAt(0) > last.charCodeAt(0)) return undefined
      for (let code = first.charCodeAt(0); code <= last.charCodeAt(0); code += 1) if (code < 128) chars.add(String.fromCharCode(code))
      index += 2
    } else chars.add(first)
  }
  if (!negate) return chars
  const complement = new Set<string>()
  for (let code = 33; code <= 126; code += 1) {
    const char = String.fromCharCode(code)
    if (!chars.has(char)) complement.add(char)
  }
  return complement
}

export function validateWorkItemPattern(pattern: unknown): RegExp {
  const fallback = '^[A-Z]+-[0-9]+$'
  if (pattern === undefined) return new RegExp(fallback)
  if (typeof pattern !== 'string' || pattern.length > 128 || !pattern.startsWith('^') || !pattern.endsWith('$')) throw new Error('work_item_id_pattern must be an anchored string of at most 128 characters')
  const body = pattern.slice(1, -1)
  const atoms: { set: Set<string>; variable: boolean; min: number; max: number; literal: boolean }[] = []
  let index = 0
  while (index < body.length) {
    let set: Set<string>
    let literal = false
    if (body[index] === '[') {
      const end = body.indexOf(']', index + 1)
      if (end < 0) throw new Error('work_item_id_pattern contains an unclosed character class')
      const value = patternCharSet(body.slice(index + 1, end))
      if (!value || value.size === 0) throw new Error('work_item_id_pattern contains an unsafe character class')
      set = value
      index = end + 1
    } else {
      const char = body[index] as string
      if (!/[A-Za-z0-9_-]/.test(char)) throw new Error('work_item_id_pattern uses a disallowed regex construct')
      literal = true
      set = new Set([char])
      index += 1
    }
    let min = 1
    let max = 1
    const quantifier = body[index]
    if (quantifier === '+' || quantifier === '*') { min = quantifier === '+' ? 1 : 0; max = 65; index += 1 }
    else if (quantifier === '?') { min = 0; max = 1; index += 1 }
    else if (quantifier === '{') {
      const end = body.indexOf('}', index + 1)
      const range = end < 0 ? '' : body.slice(index + 1, end)
      const match = /^(\d{1,2})(?:,(\d{1,2}))?$/.exec(range)
      if (!match) throw new Error('work_item_id_pattern has an invalid numeric quantifier')
      min = Number(match[1])
      max = match[2] === undefined ? min : Number(match[2])
      if (max < min || max > 64) throw new Error('work_item_id_pattern quantifiers must be bounded at 64')
      index = end + 1
    }
    atoms.push({ set, variable: max !== min, min, max, literal })
  }
  if (atoms.length === 0) throw new Error('work_item_id_pattern may not be empty')
  for (let left = 0; left < atoms.length; left += 1) {
    const first = atoms[left]
    if (!first?.variable) continue
    for (let right = left + 1; right < atoms.length; right += 1) {
      const next = atoms[right]
      if (!next) continue
      if (next.variable) {
        const between = atoms.slice(left + 1, right)
          const overlaps = [...first.set].some((char) => next.set.has(char))
          const badSeparator = between.some((atom) => [...atom.set].some((char) => first.set.has(char) || next.set.has(char)))
          const requiredSeparator = between.length > 0 && between.every((atom) => !atom.variable && atom.literal)
          if ((!requiredSeparator && overlaps) || (requiredSeparator && badSeparator) || (between.length > 0 && !requiredSeparator)) throw new Error('work_item_id_pattern has ambiguous adjacent variable quantifiers')
        break
      }
    }
  }
  try { return new RegExp(pattern) } catch { throw new Error('work_item_id_pattern is not valid') }
}

async function selectedPattern(root: string, paths: ContextPaths): Promise<RegExp> {
  const info = await pathInfo(root, paths.config)
  if (info.unsafe) throw new Error(info.unsafe)
  if (!info.exists) return validateWorkItemPattern(undefined)
  const parsed = JSON.parse(await readSafe(root, paths.config)) as unknown
  if (!isRecord(parsed)) throw new Error('Selected adapter config must be a JSON object')
  return validateWorkItemPattern(parsed['work_item_id_pattern'])
}

async function makePaths(root: string, layout: ContextLayout): Promise<{ paths: ContextPaths; missing: string[] }> {
  const found = new Map<string, string | undefined>()
  const candidates: Record<string, string[]> = {
    index: layout === '.ai' ? ['.ai/README.md'] : layout === '.agents' ? ['.agents/INDEX.md', '.agents/context/INDEX.md', '.agents/context.json'] : [layout + '/INDEX.md', layout + '/README.md'],
    workflow: layout === '.agents' ? ['.agents/workflow.md', '.agents/context/workflow.md'] : ['' + layout + '/workflow.md', layout + '/workflows/core.md'],
    routing: layout === '.context' ? ['.context/context-routing/', '.context/routing/'] : layout === '.agents' ? ['.agents/context-routing/', '.agents/context/context-routing/'] : [layout + '/routing/', layout + '/context-routing/'],
    work: layout === '.ai' ? ['.ai/tasks/'] : layout === '.agents' ? ['.agents/work/', '.agents/tasks/', '.agents/context/work/'] : [layout + '/work/'],
    templates: layout === '.ai' ? ['.ai/tasks/templates/'] : layout === '.agents' ? ['.agents/templates/', '.agents/work/templates/'] : [layout + '/templates/'],
    scripts: [layout + '/scripts/', 'scripts/'],
    onboarding: layout === '.context' ? ['.context/prompts/initialize-project.md'] : [layout + '/prompts/initialize-project.md'],
    promptsBase: layout === '.ai' ? ['.ai/prompts-base.md'] : [],
    config: [layout + '/config.json'],
    validator: [layout + '/scripts/validate_context.py', 'scripts/validate_context.py'],
  }
  for (const [key, paths] of Object.entries(candidates)) found.set(key, await firstExisting(root, paths, key === 'routing' || key === 'work' || key === 'templates' || key === 'scripts' ? 'directory' : 'file'))
  const normalized = normalizedPaths(layout, root, found)
  const missing = Object.entries({ index: normalized.index, workflow: normalized.workflow, routing: normalized.routing, work: normalized.work, templates: normalized.templates, scripts: normalized.scripts, config: normalized.config, validator: normalized.validator })
    .filter(([key]) => !found.get(key))
    .map(([key]) => key)
  if (normalized.onboardingSources.length === 0) missing.push('onboarding')
  return { paths: normalized, missing }
}

const MODULE_DECISION_FILE = '.csd-module-context.json'

function defaultModuleRoots(layout: ContextLayout): string[] {
  const primary = layout === '.context'
    ? ['.context/project/modules', '.context/project/domains', '.context/project/bounded-contexts', '.context/modules', '.context/domains']
    : layout === '.ai'
      ? ['.ai/modules', '.ai/domains', '.ai/bounded-contexts', '.ai/project/modules']
      : [layout + '/project/modules', layout + '/modules', layout + '/domains', layout + '/bounded-contexts']
  const compatibility = layout === '.context' || layout === '.ai' ? DEFAULT_MODULE_CONTEXT_ROOTS.filter((path) => path.startsWith('.context/') || path.startsWith('.ai/')) : []
  return [...new Set([...primary, ...compatibility])]
}

function moduleContextRoots(layout: ContextLayout, settings: ModuleContextSettings): string[] {
  const roots = settings.search_roots ?? defaultModuleRoots(layout)
  return [...new Set(roots)].filter((path) => safeRelativePath(path))
}

async function readModuleDecision(root: string, layout: ContextLayout): Promise<ModuleContextDecision | undefined> {
  const decisionPath = layout + '/' + MODULE_DECISION_FILE
  const info = await pathInfo(root, decisionPath)
  if (info.unsafe) throw new Error(info.unsafe)
  if (!info.exists) return undefined
  if (info.kind !== 'file') throw new Error(decisionPath + ' must be a regular file')
  let parsed: unknown
  try { parsed = JSON.parse(await readSafe(root, decisionPath)) } catch (error) { throw new Error('Invalid ' + decisionPath + ': ' + (error instanceof Error ? error.message : String(error))) }
  if (!isRecord(parsed) || parsed['schemaVersion'] !== 1 || typeof parsed['decision'] !== 'string' || !['enabled', 'declined'].includes(parsed['decision'])) throw new Error('Invalid module context decision record')
  return parsed['decision'] as ModuleContextDecision
}

async function readModuleSettings(root: string, config: ContextConfig, paths: ContextPaths | undefined): Promise<ModuleContextSettings> {
  const fallback = { ...config.moduleContext }
  if (!paths) return fallback
  const info = await pathInfo(root, paths.config)
  if (info.unsafe) throw new Error(info.unsafe)
  if (!info.exists) return fallback
  if (info.kind !== 'file') throw new Error('Selected adapter config is not a regular file')
  let parsed: unknown
  try { parsed = JSON.parse(await readSafe(root, paths.config)) } catch (error) { throw new Error('Invalid selected adapter config: ' + (error instanceof Error ? error.message : String(error))) }
  if (!isRecord(parsed)) throw new Error('Selected adapter config must be a JSON object')
  const configured = parsed['module_context'] ?? parsed['moduleContext']
  if (configured !== undefined && !validModuleContextSettings(configured)) throw new Error('module_context has an invalid shape')
  return { ...fallback, ...(configured as ModuleContextSettings | undefined) }
}

async function scanModuleRoot(root: string, searchRoot: string): Promise<{ exists: boolean; structureFiles: string[]; moduleFiles: string[] }> {
  const info = await pathInfo(root, searchRoot)
  if (info.unsafe) throw new Error(info.unsafe)
  if (!info.exists) return { exists: false, structureFiles: [], moduleFiles: [] }
  if (info.kind !== 'directory') throw new Error('Module context search root is not a directory: ' + searchRoot)
  const structureFiles: string[] = []
  const moduleFiles: string[] = []
  const entries = (await readdir(join(root, searchRoot), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 256)
  for (const entry of entries) {
    const relativePath = searchRoot + '/' + entry.name
    const entryInfo = await pathInfo(root, relativePath)
    if (entryInfo.unsafe) throw new Error(entryInfo.unsafe)
    if (!entryInfo.exists) continue
    if (entryInfo.kind === 'file' && entry.name.toLowerCase().endsWith('.md')) {
      if (MODULE_STRUCTURE_FILES.has(entry.name)) structureFiles.push(relativePath)
      else moduleFiles.push(relativePath)
      continue
    }
    if (entryInfo.kind !== 'directory' || entry.name.startsWith('.')) continue
    const nested = (await readdir(join(root, relativePath), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 64)
    for (const child of nested) {
      if (!child.isFile() || !child.name.toLowerCase().endsWith('.md')) continue
      const childPath = relativePath + '/' + child.name
      const childInfo = await pathInfo(root, childPath)
      if (childInfo.unsafe) throw new Error(childInfo.unsafe)
      if (!childInfo.exists || childInfo.kind !== 'file') continue
      if (MODULE_STRUCTURE_FILES.has(child.name)) structureFiles.push(childPath)
      else moduleFiles.push(childPath)
    }
  }
  return { exists: true, structureFiles, moduleFiles }
}

async function discoverModuleContext(root: string, layout: ContextLayout, config: ContextConfig, paths?: ContextPaths): Promise<ModuleContextDiscovery> {
  const settings = await readModuleSettings(root, config, paths)
  const persistedDecision = await readModuleDecision(root, layout)
  const decision = persistedDecision ?? settings.decision ?? 'pending'
  const configuredRoots = moduleContextRoots(layout, settings)
  const rejectedRoots = configuredRoots.filter((path) => protectedTarget(path, config.protectedPaths))
  const searchRoots = configuredRoots.filter((path) => !rejectedRoots.includes(path))
  const existingRoots: string[] = []
  const structureFiles: string[] = []
  const moduleFiles: string[] = []
  const warnings: string[] = rejectedRoots.map((path) => 'module context search root is protected and was skipped: ' + path)
  for (const searchRoot of searchRoots) {
    const scanned = await scanModuleRoot(root, searchRoot)
    if (!scanned.exists) continue
    existingRoots.push(searchRoot)
    structureFiles.push(...scanned.structureFiles)
    moduleFiles.push(...scanned.moduleFiles)
  }
  const enabled = settings.enabled !== false && decision !== 'declined' && searchRoots.length > 0
  const scaffoldRoot = searchRoots[0] ?? defaultModuleRoots(layout)[0] ?? layout + '/modules'
  const status: ModuleContextStatus = settings.enabled === false ? 'disabled' : searchRoots.length === 0 ? 'invalid' : decision === 'declined' ? 'declined' : moduleFiles.length > 0 || structureFiles.length > 0 ? 'found' : 'missing'
  const needsPrompt = enabled && decision === 'pending' && settings.prompt_policy !== 'never' && moduleFiles.length === 0 && structureFiles.length === 0
  if (existingRoots.length > 1) warnings.push('multiple module context roots found; existing structure was preserved')
  return {
    status,
    decision,
    enabled,
    prompt_policy: settings.prompt_policy ?? 'once',
    search_roots: searchRoots,
    existing_roots: existingRoots,
    structure_files: [...new Set(structureFiles)].sort(),
    module_files: [...new Set(moduleFiles)].sort(),
    scaffold_root: scaffoldRoot,
    config_path: paths?.config ?? layout + '/config.json',
    decision_path: layout + '/' + MODULE_DECISION_FILE,
    needs_prompt: needsPrompt,
    warnings,
  }
}

function validateAdapterPaths(adapter: ContextAdapter, result: { paths: ContextPaths; missing: string[] }): { paths: ContextPaths; missing: string[] } {
  if (!result || !result.paths || result.paths.root !== adapter.root) throw new Error('Adapter ' + adapter.id + ' returned an invalid context root')
  const paths = result.paths
  for (const key of ['root', 'index', 'workflow', 'routing', 'work', 'templates', 'scripts', 'config'] as const) if (!safeRelativePath(paths[key])) throw new Error('Adapter ' + adapter.id + ' returned an unsafe ' + key + ' path')
  for (const key of ['index', 'workflow', 'routing', 'work', 'templates', 'scripts', 'config'] as const) {
    const sharedTooling = key === 'scripts' && (paths[key] === 'scripts' || paths[key] === 'scripts/')
    if (!sharedTooling && paths[key] !== adapter.root && !paths[key].startsWith(adapter.root + '/')) throw new Error('Adapter ' + adapter.id + ' returned a path outside its context root')
  }
  if (paths.onboarding !== undefined && !safeRelativePath(paths.onboarding)) throw new Error('Adapter ' + adapter.id + ' returned an unsafe onboarding path')
  if (paths.onboarding !== undefined && paths.onboarding !== adapter.root && !paths.onboarding.startsWith(adapter.root + '/')) throw new Error('Adapter ' + adapter.id + ' returned onboarding outside its context root')
  if (paths.validator !== undefined && !safeRelativePath(paths.validator)) throw new Error('Adapter ' + adapter.id + ' returned an unsafe validator path')
  if (!Array.isArray(paths.onboardingSources) || !paths.onboardingSources.every((path) => safeRelativePath(path))) throw new Error('Adapter ' + adapter.id + ' returned unsafe onboarding sources')
  if (!paths.onboardingSources.every((path) => path.startsWith(adapter.root + '/'))) throw new Error('Adapter ' + adapter.id + ' returned onboarding sources outside its context root')
  if (!Array.isArray(result.missing) || !result.missing.every((item) => typeof item === 'string')) throw new Error('Adapter ' + adapter.id + ' returned invalid missing components')
  return result
}

export function registerContextAdapter(adapter: ContextAdapter): () => void {
  if (!adapter || typeof adapter.id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(adapter.id) || !safeRelativePath(adapter.root) || !validMarkerRule(adapter.markerRules)) throw new Error('Context adapter has an invalid id, root, or marker rule')
  if (ADAPTER_REGISTRY.has(adapter.id)) throw new Error('Context adapter is already registered: ' + adapter.id)
  if ([...ADAPTER_REGISTRY.values()].some((registered) => registered.root === adapter.root)) throw new Error('Context adapter root is already registered: ' + adapter.root)
  for (const marker of [...(adapter.markerRules.allOf ?? []), ...(adapter.markerRules.anyOf ?? []).flat()]) if (!safeRelativePath(marker)) throw new Error('Context adapter has an unsafe marker path')
  if (typeof adapter.resolve !== 'function' || typeof adapter.mapBootstrapPath !== 'function' || typeof adapter.transformTemplate !== 'function') throw new Error('Context adapter is missing a required operation')
  ADAPTER_REGISTRY.set(adapter.id, adapter)
  return () => { if (ADAPTER_REGISTRY.get(adapter.id) === adapter) ADAPTER_REGISTRY.delete(adapter.id) }
}

for (const layout of LAYOUTS) {
  ADAPTER_REGISTRY.set(layout, {
    id: layout,
    root: layout,
    mode: layout === '.context' ? 'native' : 'compatibility',
    markerRules: markerRule(layout),
    enabledByDefault: true,
    resolve: (root) => makePaths(root, layout),
    mapBootstrapPath: (sourceRelativePath) => adapterTargetPath(layout, sourceRelativePath),
    transformTemplate: (content) => transformTemplate(content, layout),
  })
}

export async function discoverContext(rootPath: string, options: DiscoveryOptions = {}): Promise<DiscoveryResult> {
  const absolute = resolve(rootPath)
  let root: string
  try { root = await realpath(absolute) } catch { return invalidResult(absolute, 'repository root does not exist') }
  let config: ContextConfig
  try { config = await loadConfig(root) } catch (error) { return invalidResult(root, error instanceof Error ? error.message : String(error)) }
  const reportedProtected = new Set(config.protectedPaths)
  const candidates: ContextCandidate[] = []
  for (const layout of [...config.enabledAdapters].sort((a, b) => a.localeCompare(b))) {
    const adapter = ADAPTER_REGISTRY.get(layout)
    if (!adapter) return invalidResult(root, 'configured adapter is not registered: ' + layout)
    candidates.push(await evaluateCandidate(root, adapter, config.markerRules))
  }
  const unsafe = candidates.filter((candidate) => candidate.error)
  if (unsafe.length > 0) return invalidResult(root, unsafe.map((candidate) => candidate.error).join('; '), candidates)
  const valid = candidates.filter((candidate) => candidate.valid)
  if (valid.length === 0) {
    return { status: 'bootstrap_required', mode: 'bootstrap', root: '.', layout: config.canonicalLayout, capabilities: { ...EMPTY_CAPABILITIES }, markerEvidence: candidates, candidates, missing: [], conflicts: [], protectedPaths: [...config.protectedPaths], created: [], modified: [], migration_required: false, onboarding_required: true, precedence_applied: false, warnings: [] }
  }
  let selected: ContextCandidate | undefined
  let precedenceApplied = false
  const conflicts: string[] = []
  if (valid.length === 1) selected = valid[0]
  else if (config.resolveMultipleCandidatesSilently && valid.every((candidate) => config.adapterPrecedence.includes(candidate.layout))) {
    selected = [...valid].sort((a, b) => config.adapterPrecedence.indexOf(a.layout) - config.adapterPrecedence.indexOf(b.layout))[0]
    precedenceApplied = true
  } else {
    conflicts.push('multiple valid context layouts: ' + valid.map((candidate) => candidate.layout).sort().join(', '))
  }
  if (!selected) return { status: 'conflict', mode: 'compatibility', root: '.', capabilities: { ...EMPTY_CAPABILITIES }, markerEvidence: candidates, candidates, missing: [], conflicts, protectedPaths: [...config.protectedPaths], created: [], modified: [], migration_required: false, onboarding_required: false, precedence_applied: false, warnings: [] }
  let built: { paths: ContextPaths; missing: string[] }
  try {
    const adapter = ADAPTER_REGISTRY.get(selected.layout)
    if (!adapter) throw new Error('Selected context adapter is not registered')
    built = validateAdapterPaths(adapter, await adapter.resolve(root))
    await selectedPattern(root, built.paths)
  } catch (error) {
    return invalidResult(root, error instanceof Error ? error.message : String(error), candidates)
  }
  const existsCap = async (path: string | undefined, kind?: 'file' | 'directory') => {
    if (path === undefined) return false
    const info = await pathInfo(root, path.replace(/\/$/, ''))
    if (info.unsafe) throw new Error(info.unsafe)
    return info.exists && (kind === undefined || info.kind === kind)
  }
  const paths = built.paths
  const caps = {
    index: await existsCap(paths.index, 'file'),
    workflow: await existsCap(paths.workflow, 'file'),
    routing: await existsCap(paths.routing, 'directory'),
    work: await existsCap(paths.work, 'directory'),
    templates: await existsCap(paths.templates, 'directory'),
    scripts: await existsCap(paths.scripts, 'directory'),
    onboarding: paths.onboardingSources.length > 0 || await existsCap(paths.onboarding, 'file'),
    validator: await existsCap(paths.validator, 'file'),
  }
  const warnings: string[] = []
  for (const integration of (options.integrations ?? []).filter((item) => config.optionalFrameworkIntegrations.includes(item.id))) {
    try {
      const observation = await integration.detect?.(root, { status: 'resolved', mode: ADAPTER_REGISTRY.get(selected.layout)?.mode ?? 'compatibility', root: '.', layout: selected.layout, paths, capabilities: caps, markerEvidence: candidates, candidates, selected, missing: built.missing, conflicts: [], protectedPaths: [...reportedProtected].sort(), created: [], modified: [], migration_required: false, onboarding_required: false, precedence_applied: precedenceApplied, warnings: [] })
      warnings.push(...(observation?.warnings ?? []))
      if (observation?.onboardingHint) warnings.push('framework integration ' + integration.id + ' onboarding hint: ' + observation.onboardingHint)
      for (const protectedPath of observation?.protectedPaths ?? []) {
        if (safeRelativePath(protectedPath)) reportedProtected.add(protectedPath)
        else warnings.push('framework integration ' + integration.id + ' reported an unsafe protected path')
      }
      if (isRecord(observation?.validation) && observation.validation['ok'] === false) {
        warnings.push('framework integration ' + integration.id + ' reported a validation failure')
      }
    } catch (error) { warnings.push('framework integration ' + integration.id + ' failed: ' + (error instanceof Error ? error.message : String(error))) }
  }
  let onboardingRequired = false
  if (config.onboardingPolicy !== 'never' && selected.layout === '.context' && caps.onboarding) {
    try {
      const completion = await pathInfo(root, '.context/.onboarding-complete')
      if (completion.unsafe) throw new Error(completion.unsafe)
      const selectedConfig = JSON.parse(await readSafe(root, paths.config)) as Record<string, unknown>
      const onboarding = isRecord(selectedConfig['onboarding']) ? selectedConfig['onboarding'] : {}
      const overview = await (async () => { try { return await readSafe(root, '.context/project/overview.md') } catch { return '' } })()
      const stack = await (async () => { try { return await readSafe(root, '.context/project/stack.md') } catch { return '' } })()
      const project = isRecord(selectedConfig['project']) ? selectedConfig['project'] : {}
      const placeholderOnly = project['name'] === 'Adopting project' || !overview || overview.includes('NOT FOUND') || stack.includes('NOT FOUND')
      onboardingRequired = !completion.exists && onboarding['completed'] !== true && placeholderOnly
    } catch (error) {
      return invalidResult(root, error instanceof Error ? error.message : String(error), candidates)
    }
  }
  let moduleContext: ModuleContextDiscovery
  try {
    moduleContext = await discoverModuleContext(root, selected.layout, config, paths)
    warnings.push(...moduleContext.warnings)
  } catch (error) {
    return invalidResult(root, error instanceof Error ? error.message : String(error), candidates)
  }
  return {
    status: 'resolved', mode: ADAPTER_REGISTRY.get(selected.layout)?.mode ?? 'compatibility', root: '.',
    layout: selected.layout, paths, capabilities: caps, markerEvidence: candidates, candidates, selected,
    missing: built.missing, conflicts: [], protectedPaths: [...reportedProtected].sort(), created: [], modified: [],
    migration_required: false, onboarding_required: onboardingRequired, precedence_applied: precedenceApplied, warnings, module_context: moduleContext,
  }
}

export async function contextConfiguration(rootPath: string): Promise<ContextConfig> {
  const root = await realpath(resolve(rootPath))
  return loadConfig(root)
}

function moduleDecisionContent(decision: Exclude<ModuleContextDecision, 'pending'>, scaffoldRoot?: string, files?: string[]): string {
  return JSON.stringify({
    schemaVersion: 1,
    decision,
    ...(scaffoldRoot ? { scaffoldRoot } : {}),
    ...(files && files.length > 0 ? { files } : {}),
  }, null, 2) + NL
}

async function moduleContextFiles(root: string, discovery: DiscoveryResult): Promise<{ readme: string; template: string; decision: string }> {
  const moduleContext = discovery.module_context
  if (!moduleContext || !discovery.layout) throw new Error('Module context discovery is unavailable')
  const readme = moduleContext.scaffold_root + '/README.md'
  const template = moduleContext.scaffold_root + '/_module-template.md'
  const decision = moduleContext.decision_path
  for (const path of [readme, template, decision]) {
    const info = await pathInfo(root, path)
    if (info.unsafe) throw new Error(info.unsafe)
  }
  return { readme, template, decision }
}

export async function moduleContextPreview(rootPath: string): Promise<ModuleContextPlan> {
  const root = await realpath(resolve(rootPath))
  const discovery = await discoverContext(root)
  const moduleContext = discovery.module_context
  const tokenBase = { root, status: discovery.status, moduleContext }
  if (discovery.status !== 'resolved' || !moduleContext) {
    const conflicts = ['module documentation discovery requires a uniquely selected context layout']
    return { root: '.', action: 'noop', discovery, files: [], conflicts, token: createHash('sha256').update(JSON.stringify({ ...tokenBase, conflicts })).digest('hex'), summary: conflicts[0] as string }
  }
  if (moduleContext.status === 'found' || moduleContext.status === 'disabled' || moduleContext.status === 'declined') {
    return { root: '.', action: 'noop', discovery, files: [], conflicts: [], token: createHash('sha256').update(JSON.stringify(tokenBase)).digest('hex'), summary: 'Module documentation already exists or is disabled; no scaffold is needed.' }
  }
  const files = await moduleContextFiles(root, discovery)
  const desired = new Map<string, string>([
    [files.readme, MODULE_README],
    [files.template, MODULE_TEMPLATE],
  ])
  const planned: ModuleContextFilePlan[] = []
  const conflicts: string[] = []
  for (const [path, content] of desired) {
    if (protectedTarget(path, discovery.protectedPaths)) {
      planned.push({ path, action: 'conflict', reason: 'target overlaps a protected path' })
      conflicts.push(path + ': target overlaps a protected path')
      continue
    }
    const info = await pathInfo(root, path)
    if (info.unsafe) {
      planned.push({ path, action: 'conflict', reason: info.unsafe })
      conflicts.push(path + ': ' + info.unsafe)
      continue
    }
    const digest = await sha256(content)
    if (!info.exists) planned.push({ path, action: 'create', sha256: digest })
    else if (info.kind !== 'file') {
      planned.push({ path, action: 'conflict', sha256: digest, reason: 'target is not a regular file' })
      conflicts.push(path + ': target is not a regular file')
    } else if (await sha256(await readSafe(root, path)) === digest) planned.push({ path, action: 'skip', sha256: digest, reason: 'identical existing scaffold file' })
    else {
      planned.push({ path, action: 'conflict', sha256: digest, reason: 'existing file is preserved; scaffold will not overwrite it' })
      conflicts.push(path + ': existing file is preserved; scaffold will not overwrite it')
    }
  }
  const decisionContent = moduleDecisionContent('enabled', moduleContext.scaffold_root, [files.readme, files.template])
  const decisionDigest = await sha256(decisionContent)
  const decisionInfo = await pathInfo(root, files.decision)
  if (decisionInfo.unsafe) {
    planned.push({ path: files.decision, action: 'conflict', reason: decisionInfo.unsafe })
    conflicts.push(files.decision + ': ' + decisionInfo.unsafe)
  } else if (!decisionInfo.exists) planned.push({ path: files.decision, action: 'create', sha256: decisionDigest })
  else if (decisionInfo.kind !== 'file') {
    planned.push({ path: files.decision, action: 'conflict', sha256: decisionDigest, reason: 'decision path is not a regular file' })
    conflicts.push(files.decision + ': decision path is not a regular file')
  } else if (await sha256(await readSafe(root, files.decision)) === decisionDigest) planned.push({ path: files.decision, action: 'skip', sha256: decisionDigest, reason: 'module context decision is already enabled' })
  else {
    planned.push({ path: files.decision, action: 'conflict', sha256: decisionDigest, reason: 'existing module context decision is preserved' })
    conflicts.push(files.decision + ': existing module context decision is preserved')
  }
  const token = createHash('sha256').update(JSON.stringify({ ...tokenBase, files: planned, conflicts })).digest('hex')
  const creates = planned.filter((file) => file.action === 'create').length
  return { root: '.', action: 'create', discovery, files: planned, conflicts, token, summary: creates + ' module-context file(s) to create, ' + (planned.length - creates) + ' skipped/conflicting. Nothing was written.' }
}

export async function moduleContextApply(rootPath: string, token: string, confirmed: boolean, decline = false): Promise<{ created: string[]; skipped: string[]; conflicts: string[] }> {
  if (!confirmed) throw new Error('Module context apply requires confirmed: true')
  const root = await realpath(resolve(rootPath))
  const discovery = await discoverContext(root)
  if (discovery.status !== 'resolved' || !discovery.module_context) throw new Error('Module documentation requires a uniquely selected context layout')
  const preview = await moduleContextPreview(root)
  if (!token || token !== preview.token) throw new Error('Module context apply requires the exact current preview token')
  if (preview.conflicts.length > 0) throw new Error('Module context preview contains unresolved conflicts')
  if (discovery.module_context.status !== 'missing') return { created: [], skipped: [], conflicts: [] }
  const files = await moduleContextFiles(root, discovery)
  if (decline) {
    const info = await pathInfo(root, files.decision)
    if (info.exists) throw new Error('Module context decision already exists; refusing to replace it')
    await writeSafe(root, files.decision, moduleDecisionContent('declined'))
    return { created: [files.decision], skipped: [], conflicts: [] }
  }
  const desired = new Map<string, string>([
    [files.readme, MODULE_README],
    [files.template, MODULE_TEMPLATE],
    [files.decision, moduleDecisionContent('enabled', discovery.module_context.scaffold_root, [files.readme, files.template])],
  ])
  const created: string[] = []
  const skipped: string[] = []
  for (const item of preview.files) {
    const content = desired.get(item.path)
    if (content === undefined) throw new Error('Module context source missing for ' + item.path)
    if (item.action === 'skip') { skipped.push(item.path); continue }
    if (item.action !== 'create') throw new Error('Module context preview contains an unsupported action: ' + item.action)
    const current = await pathInfo(root, item.path)
    if (current.unsafe) throw new Error(current.unsafe)
    if (current.exists) {
      if (current.kind !== 'file' || await sha256(await readSafe(root, item.path)) !== item.sha256) throw new Error('Module context target changed after preview: ' + item.path)
      skipped.push(item.path)
      continue
    }
    await writeSafe(root, item.path, content)
    created.push(item.path)
  }
  return { created, skipped, conflicts: [] }
}

export interface BootstrapFilePlan {
  path: string
  action: 'create' | 'merge' | 'skip' | 'conflict' | 'protected'
  owner?: string | undefined
  sha256?: string | undefined
  reason?: string | undefined
}
export interface BootstrapPreview {
  root: string
  discovery: DiscoveryResult
  files: BootstrapFilePlan[]
  conflicts: string[]
  token: string
  summary: string
}

interface OwnershipManifest {
  schemaVersion: 1
  owner: string
  files: Record<string, { sha256: string; status: 'pending' | 'complete' }>
}
const MANIFEST = '.csd-bootstrap.json'
const CSD_BEGIN = '<!-- CSD:BEGIN -->'
const CSD_END = '<!-- CSD:END -->'
const NL = String.fromCharCode(10)
const AGENTS_BLOCK = CSD_BEGIN + NL + 'This repository uses context-spec-develop. Read the configured context index before operational work and follow the canonical front door.' + NL + CSD_END + NL

async function loadManifest(root: string): Promise<OwnershipManifest> {
  const info = await pathInfo(root, MANIFEST)
  if (info.unsafe) throw new Error(info.unsafe)
  if (!info.exists) return { schemaVersion: 1, owner: '@owlcodium/context-spec-develop', files: {} }
  const parsed = JSON.parse(await readSafe(root, MANIFEST)) as unknown
  if (!isRecord(parsed) || parsed['schemaVersion'] !== 1 || parsed['owner'] !== '@owlcodium/context-spec-develop' || !isRecord(parsed['files'])) throw new Error('Malformed CSD bootstrap ownership manifest')
  for (const [path, value] of Object.entries(parsed['files'])) if (!safeRelativePath(path) || !isRecord(value) || typeof value['sha256'] !== 'string' || !['pending', 'complete'].includes(String(value['status']))) throw new Error('Malformed CSD bootstrap ownership entry')
  return parsed as unknown as OwnershipManifest
}

function protectedTarget(path: string, protectedPaths: string[]): boolean {
  const target = path.replace(/\/$/, '')
  return protectedPaths.some((entry) => target === entry || target.startsWith(entry + '/') || entry.startsWith(target + '/'))
}

function transformTemplate(content: string, layout: ContextLayout): string {
  if (layout === '.context') return content
  let transformed = content
  if (layout === '.ai') {
    transformed = transformed.replaceAll('.context/INDEX.md', '.ai/README.md')
      .replaceAll('.context/work/', '.ai/tasks/')
      .replaceAll('.context/templates/', '.ai/tasks/templates/')
  }
  return transformed.replace(/\.context/g, layout)
}

function adapterTargetPath(layout: ContextLayout, sourceRelative: string): string {
  if (layout === '.ai') {
    if (sourceRelative === 'INDEX.md') return '.ai/README.md'
    if (sourceRelative.startsWith('templates/')) return '.ai/tasks/' + sourceRelative
  }
  return layout + '/' + sourceRelative
}

function mergeAgentInstructions(current: string): { content?: string; conflict?: string; action: 'create' | 'merge' | 'skip' | 'conflict' } {
  const begins = current.split(CSD_BEGIN).length - 1
  const ends = current.split(CSD_END).length - 1
  if (begins === 0 && ends === 0) {
    const suffix = current.endsWith(NL) ? NL : NL + NL
    return { action: 'merge', content: current + suffix + AGENTS_BLOCK }
  }
  if (begins !== 1 || ends !== 1) return { action: 'conflict', conflict: 'AGENTS.md has duplicate or partial CSD markers' }
  const start = current.indexOf(CSD_BEGIN)
  const finish = current.indexOf(CSD_END)
  if (finish < start || current.slice(start, finish + CSD_END.length) !== AGENTS_BLOCK.trimEnd()) return { action: 'conflict', conflict: 'AGENTS.md managed CSD block was modified' }
  return { action: 'skip' }
}

async function desiredFiles(root: string, discovery: DiscoveryResult): Promise<{ path: string; content: string }[]> {
  const adapter = discovery.layout ? ADAPTER_REGISTRY.get(discovery.layout) : undefined
  if (!adapter) throw new Error('Bootstrap adapter is not registered')
  const bootstrapAdapter = adapter
  const source = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const assetCandidates = [resolve(source, 'assets/template/.context'), resolve(source, '../assets/template/.context'), resolve(process.cwd(), '.context')]
  let sourceRoot: string | undefined
  for (const candidate of assetCandidates) { try { await realpath(candidate); sourceRoot = candidate; break } catch {} }
  if (!sourceRoot) throw new Error('CSD template assets are unavailable')
  const { readdir } = await import('node:fs/promises')
  const files: { path: string; content: string }[] = []
  async function visit(dir: string): Promise<void> {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const absolute = join(dir, entry.name)
      const rel = relative(sourceRoot as string, absolute).split(sep).join('/')
      if (rel === 'work' || rel.startsWith('work/')) continue
      if (entry.isDirectory()) await visit(absolute)
      else if (entry.isFile()) {
        const target = bootstrapAdapter.mapBootstrapPath(rel)
        if (!safeRelativePath(target) || !(target.startsWith(bootstrapAdapter.root + '/') || target === bootstrapAdapter.root)) throw new Error('Adapter ' + bootstrapAdapter.id + ' mapped a bootstrap file outside its context root')
        files.push({ path: target, content: bootstrapAdapter.transformTemplate(await readFile(absolute, 'utf8')) })
      }
    }
  }
  await visit(sourceRoot)
  if (discovery.layout === '.ai') files.push({ path: '.ai/tasks/.gitkeep', content: '' })
  return files.sort((a, b) => a.path.localeCompare(b.path))
}

async function packagedAgentsContent(layout: ContextLayout): Promise<string> {
  const adapter = ADAPTER_REGISTRY.get(layout)
  if (!adapter) throw new Error('Bootstrap adapter is not registered: ' + layout)
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const candidates = [resolve(packageRoot, 'assets/template/AGENTS.md'), resolve(packageRoot, 'AGENTS.md'), resolve(process.cwd(), 'AGENTS.md')]
  for (const candidate of candidates) {
    try { return adapter.transformTemplate(await readFile(candidate, 'utf8')) } catch {}
  }
  throw new Error('CSD AGENTS template is unavailable')
}

export async function bootstrapPreview(rootPath: string): Promise<BootstrapPreview> {
  const root = await realpath(resolve(rootPath))
  const discovery = await discoverContext(root)
  if (discovery.status === 'resolved') {
    const token = createHash('sha256').update(JSON.stringify({ root, state: 'resolved', layout: discovery.layout, candidates: discovery.candidates })).digest('hex')
    return { root: '.', discovery, files: [], conflicts: [], token, summary: describeDiscovery(discovery) }
  }
  if (discovery.status === 'invalid' || discovery.status === 'conflict') {
    const token = createHash('sha256').update(JSON.stringify({ root, status: discovery.status, conflicts: discovery.conflicts })).digest('hex')
    return { root: '.', discovery, files: [], conflicts: discovery.conflicts, token, summary: describeDiscovery(discovery) }
  }
  const config = await contextConfiguration(root)
  const sourceFiles = await desiredFiles(root, discovery)
  let manifest: OwnershipManifest
  try {
    manifest = await loadManifest(root)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    const files: BootstrapFilePlan[] = [{ path: MANIFEST, action: 'conflict', reason }]
    const conflicts = [MANIFEST + ': ' + reason]
    const token = createHash('sha256').update(JSON.stringify({ root, config, candidates: discovery.candidates, files, conflicts })).digest('hex')
    return { root: '.', discovery, files, conflicts, token, summary: 'Bootstrap is blocked by the ownership manifest conflict.' }
  }
  const files: BootstrapFilePlan[] = []
  const conflicts: string[] = []
  for (const item of sourceFiles) {
    const digest = await sha256(item.content)
    if (protectedTarget(item.path, config.protectedPaths)) {
      files.push({ path: item.path, action: 'protected', sha256: digest, reason: 'target overlaps a protected path' })
      continue
    }
    const info = await pathInfo(root, item.path)
    if (info.unsafe) {
      files.push({ path: item.path, action: 'conflict', sha256: digest, reason: info.unsafe })
      conflicts.push(item.path + ': ' + info.unsafe)
      continue
    }
    const owned = manifest.files[item.path]
    if (!info.exists) {
      if (owned?.status === 'pending') files.push({ path: item.path, action: 'create', owner: manifest.owner, sha256: digest, reason: 'retry pending create' })
      else files.push({ path: item.path, action: 'create', owner: manifest.owner, sha256: digest })
      continue
    }
    if (info.kind !== 'file') {
      files.push({ path: item.path, action: 'conflict', owner: owned ? manifest.owner : undefined, sha256: digest, reason: 'target exists and is not a regular file' })
      conflicts.push(item.path + ': target is not a regular file')
      continue
    }
    const current = await readSafe(root, item.path)
    const currentHash = await sha256(current)
    if (owned?.status === 'pending' && currentHash === digest) {
      files.push({ path: item.path, action: 'skip', owner: manifest.owner, sha256: digest, reason: 'complete matching pending write' })
    } else if (owned?.status === 'pending' && currentHash !== digest) {
      files.push({ path: item.path, action: 'conflict', owner: manifest.owner, sha256: digest, reason: 'pending target differs from packaged content' })
      conflicts.push(item.path + ': pending target hash mismatch')
    } else if (owned?.status === 'complete' && owned.sha256 === currentHash && currentHash === digest) {
      files.push({ path: item.path, action: 'skip', owner: manifest.owner, sha256: digest, reason: 'owned file is unchanged' })
    } else if (owned?.status === 'complete' && owned.sha256 === currentHash) {
      files.push({ path: item.path, action: 'conflict', owner: manifest.owner, sha256: digest, reason: 'managed content changed; explicit migration is required' })
      conflicts.push(item.path + ': managed content changed')
    } else if (currentHash === digest) {
      files.push({ path: item.path, action: 'skip', sha256: digest, reason: 'identical unowned file; it will not be claimed' })
    } else {
      files.push({ path: item.path, action: 'conflict', sha256: digest, reason: owned ? 'owned file hash mismatch' : 'unowned content collision' })
      conflicts.push(item.path + ': ' + (owned ? 'owned file hash mismatch' : 'unowned content collision'))
    }
  }
  const agentInfo = await pathInfo(root, 'AGENTS.md')
  const agentProtected = protectedTarget('AGENTS.md', config.protectedPaths)
  const ownedAgent = manifest.files['AGENTS.md']
  if (agentProtected) files.push({ path: 'AGENTS.md', action: 'protected', reason: 'target overlaps a protected path' })
  if (!agentProtected && agentInfo.unsafe) { files.push({ path: 'AGENTS.md', action: 'conflict', reason: agentInfo.unsafe }); conflicts.push('AGENTS.md: ' + agentInfo.unsafe) }
  else if (!agentProtected && !agentInfo.exists) files.push({ path: 'AGENTS.md', action: 'create', owner: manifest.owner, sha256: await sha256(await packagedAgentsContent(config.canonicalLayout)) })
  else if (!agentProtected && agentInfo.kind !== 'file') { files.push({ path: 'AGENTS.md', action: 'conflict', reason: 'target is not a regular file' }); conflicts.push('AGENTS.md: target is not a regular file') }
  else if (!agentProtected) {
    const current = await readSafe(root, 'AGENTS.md')
    const currentHash = await sha256(current)
    const managedHash = await sha256(AGENTS_BLOCK.trimEnd())
    const merge = mergeAgentInstructions(current)
    if (ownedAgent?.status === 'pending') {
      const packagedHash = await sha256(await packagedAgentsContent(config.canonicalLayout))
      if (currentHash === ownedAgent.sha256 || (ownedAgent.sha256 === managedHash && merge.action === 'skip')) files.push({ path: 'AGENTS.md', action: 'skip', owner: manifest.owner, sha256: ownedAgent.sha256, reason: 'complete matching pending write' })
      else if (ownedAgent.sha256 === packagedHash && currentHash === packagedHash) files.push({ path: 'AGENTS.md', action: 'skip', owner: manifest.owner, sha256: packagedHash, reason: 'complete matching pending write' })
      else { files.push({ path: 'AGENTS.md', action: 'conflict', owner: manifest.owner, sha256: ownedAgent.sha256, reason: 'pending target hash mismatch' }); conflicts.push('AGENTS.md: pending target hash mismatch') }
    } else if (ownedAgent?.status === 'complete' && ownedAgent.sha256 === currentHash) {
      files.push({ path: 'AGENTS.md', action: 'skip', owner: manifest.owner, sha256: ownedAgent.sha256, reason: 'owned file is unchanged' })
    } else if (ownedAgent?.status === 'complete' && ownedAgent.sha256 === managedHash && merge.action === 'skip') {
      files.push({ path: 'AGENTS.md', action: 'skip', owner: manifest.owner, sha256: managedHash, reason: 'managed block is unchanged' })
    } else if (ownedAgent?.status === 'complete') {
      files.push({ path: 'AGENTS.md', action: 'conflict', owner: manifest.owner, sha256: ownedAgent.sha256, reason: 'owned AGENTS content changed' }); conflicts.push('AGENTS.md: owned content changed')
    } else if (merge.action === 'conflict') {
      files.push({ path: 'AGENTS.md', action: 'conflict', reason: merge.conflict }); conflicts.push('AGENTS.md: ' + merge.conflict)
    } else if (merge.action === 'merge') {
      files.push({ path: 'AGENTS.md', action: 'merge', owner: manifest.owner, sha256: managedHash })
    } else files.push({ path: 'AGENTS.md', action: 'skip', reason: 'managed CSD block is already present' })
  }
  const manifestInfo = await pathInfo(root, MANIFEST)
  if (manifestInfo.unsafe) {
    files.push({ path: MANIFEST, action: 'conflict', reason: manifestInfo.unsafe })
    conflicts.push(MANIFEST + ': ' + manifestInfo.unsafe)
  } else if (files.some((file) => file.action === 'create' || file.action === 'merge' || file.reason === 'complete matching pending write')) {
    if (protectedTarget(MANIFEST, config.protectedPaths)) {
      files.push({ path: MANIFEST, action: 'protected', owner: manifest.owner, reason: 'ownership manifest is protected' })
      conflicts.push(MANIFEST + ': ownership manifest is protected')
    } else files.push({ path: MANIFEST, action: manifestInfo.exists ? 'merge' : 'create', owner: manifest.owner, reason: 'tracks CSD-owned bootstrap files' })
  }
  const snapshot = { root, config, discovery: discovery.candidates, files, conflicts }
  const token = createHash('sha256').update(JSON.stringify(snapshot)).digest('hex')
  const creates = files.filter((file) => ['create', 'merge'].includes(file.action)).length
  return { root: '.', discovery, files, conflicts, token, summary: describeDiscovery(discovery) + '\n' + creates + ' file(s) to create or merge, ' + (files.length - creates) + ' skipped/protected/conflicting. Nothing was written.' }
}

export async function bootstrapApply(rootPath: string, token: string, confirmed: boolean): Promise<{ created: string[]; skipped: string[]; conflicts: string[] }> {
  if (!confirmed) throw new Error('Bootstrap apply requires confirmed: true after reviewing the preview')
  const preview = await bootstrapPreview(rootPath)
  if (!token || token !== preview.token) throw new Error('Bootstrap apply requires the exact token returned by the current preview')
  if (preview.discovery.status === 'resolved') return { created: [], skipped: [], conflicts: [] }
  if (preview.discovery.status !== 'bootstrap_required' || preview.conflicts.length > 0 || preview.files.some((file) => file.action === 'conflict')) {
    throw new Error('Bootstrap preview contains unresolved conflicts')
  }
  const root = await realpath(resolve(rootPath))
  const config = await contextConfiguration(root)
  const manifest = await loadManifest(root)
  const files = await desiredFiles(root, preview.discovery)
  const byPath = new Map(files.map((file) => [file.path, file.content]))
  const created: string[] = []
  const skipped: string[] = []
  for (const item of preview.files) {
    if (item.path === MANIFEST) continue
    if (item.action === 'protected' || item.action === 'conflict' || item.action === 'skip') {
      skipped.push(item.path)
      if (item.reason === 'complete matching pending write' && item.sha256) {
        manifest.files[item.path] = { sha256: item.sha256, status: 'complete' }
        await writeSafe(root, MANIFEST, JSON.stringify(manifest, null, 2) + String.fromCharCode(10))
      }
      continue
    }
    const desired = item.path === 'AGENTS.md' ? (item.action === 'merge' ? mergeAgentInstructions(await readSafe(root, 'AGENTS.md')).content as string : await packagedAgentsContent(preview.discovery.layout as ContextLayout)) : byPath.get(item.path)
    if (desired === undefined) throw new Error('Bootstrap source missing for ' + item.path)
    const digest = item.path === 'AGENTS.md' && item.action === 'merge' ? await sha256(AGENTS_BLOCK.trimEnd()) : await sha256(desired)
    manifest.files[item.path] = { sha256: digest, status: 'pending' }
    await writeSafe(root, MANIFEST, JSON.stringify(manifest, null, 2) + String.fromCharCode(10))
    const currentInfo = await pathInfo(root, item.path)
    if (currentInfo.unsafe) throw new Error(currentInfo.unsafe)
    if (!currentInfo.exists && item.action === 'create') await writeSafe(root, item.path, desired)
    else if (item.action === 'merge') await writeSafe(root, item.path, desired)
    else if (item.action === 'create') {
      const current = await readSafe(root, item.path)
      if (await sha256(current) !== digest) throw new Error('Bootstrap target changed after preview: ' + item.path)
    }
    manifest.files[item.path] = { sha256: digest, status: 'complete' }
    await writeSafe(root, MANIFEST, JSON.stringify(manifest, null, 2) + String.fromCharCode(10))
    created.push(item.path)
  }
  return { created, skipped, conflicts: [] }
}

function updateAction(path: string, exists: boolean): ContextUpdateFilePlan['action'] {
  if (!exists) return 'create'
  return path.endsWith('/config.json') ? 'update-version' : 'update'
}

function projectOwnedContextTarget(path: string, discovery: DiscoveryResult): boolean {
  const layout = discovery.layout
  const work = discovery.paths?.work?.replace(/\/$/, '')
  if (!layout) return false
  const prefixes = [
    layout + '/project/',
    layout + '/modules/',
    layout + '/domains/',
    layout + '/bounded-contexts/',
  ]
  return prefixes.some((prefix) => path.startsWith(prefix)) || (work !== undefined && (path === work || path.startsWith(work + '/')))
}

async function contextUpdateContent(root: string, discovery: DiscoveryResult, path: string, packaged: string): Promise<string> {
  if (path !== discovery.paths?.config) return packaged
  const currentInfo = await pathInfo(root, path)
  if (!currentInfo.exists || currentInfo.kind !== 'file') return packaged
  try {
    const current = JSON.parse(await readSafe(root, path)) as unknown
    const next = JSON.parse(packaged) as unknown
    if (!isRecord(current) || !isRecord(next)) return packaged
    if (typeof next['kit_version'] !== 'string') return JSON.stringify(current, null, 2) + NL
    return JSON.stringify({ ...current, kit_version: next['kit_version'] }, null, 2) + NL
  } catch {
    return packaged
  }
}

export async function contextUpdatePreview(rootPath: string): Promise<ContextUpdatePlan> {
  const root = await realpath(resolve(rootPath))
  const discovery = await discoverContext(root)
  if (discovery.status !== 'resolved' || !discovery.layout) {
    const conflicts = ['context update requires a uniquely selected context layout']
    const token = createHash('sha256').update(JSON.stringify({ root, status: discovery.status, conflicts })).digest('hex')
    return { root: '.', discovery, files: [], conflicts, token, summary: conflicts[0] as string }
  }
  const config = await contextConfiguration(root)
  let manifest: OwnershipManifest
  try { manifest = await loadManifest(root) } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    const conflicts = [MANIFEST + ': ' + reason]
    const token = createHash('sha256').update(JSON.stringify({ root, config, candidates: discovery.candidates, conflicts })).digest('hex')
    return { root: '.', discovery, files: [{ path: MANIFEST, action: 'conflict', reason }], conflicts, token, summary: 'Context update is blocked by the ownership manifest conflict.' }
  }
  const desired = await desiredFiles(root, discovery)
  const files: ContextUpdateFilePlan[] = []
  const conflicts: string[] = []
  for (const item of desired) {
    const content = await contextUpdateContent(root, discovery, item.path, item.content)
    const digest = await sha256(content)
    if (projectOwnedContextTarget(item.path, discovery)) {
      files.push({ path: item.path, action: 'protected', sha256: digest, reason: 'project-owned context is preserved by default' })
      continue
    }
    if (protectedTarget(item.path, discovery.protectedPaths)) {
      files.push({ path: item.path, action: 'protected', sha256: digest, reason: 'target overlaps a protected path' })
      continue
    }
    const info = await pathInfo(root, item.path)
    if (info.unsafe) {
      files.push({ path: item.path, action: 'conflict', sha256: digest, reason: info.unsafe })
      conflicts.push(item.path + ': ' + info.unsafe)
      continue
    }
    if (!info.exists) {
      files.push({ path: item.path, action: 'create', sha256: digest, reason: manifest.files[item.path] ? 'managed file is missing' : 'new packaged file' })
      continue
    }
    if (info.kind !== 'file') {
      files.push({ path: item.path, action: 'conflict', sha256: digest, reason: 'target is not a regular file' })
      conflicts.push(item.path + ': target is not a regular file')
      continue
    }
    const currentHash = await sha256(await readSafe(root, item.path))
    if (currentHash === digest) {
      files.push({ path: item.path, action: 'skip', sha256: digest, reason: 'already matches update content' })
      continue
    }
    if (item.path === discovery.paths?.config) {
      files.push({ path: item.path, action: 'update-version', sha256: digest, reason: 'kit_version update preserves project configuration' })
      continue
    }
    const owned = manifest.files[item.path]
    if (owned && (owned.status === 'pending' || owned.sha256 === currentHash)) {
      files.push({ path: item.path, action: updateAction(item.path, true), sha256: digest, reason: 'CSD-owned content can be updated' })
      continue
    }
    files.push({ path: item.path, action: 'conflict', sha256: digest, reason: owned ? 'file was modified after CSD bootstrap' : 'unowned file differs from packaged content' })
    conflicts.push(item.path + ': ' + (owned ? 'file was modified after CSD bootstrap' : 'unowned file differs from packaged content'))
  }
  const snapshot = { root, config, discovery: discovery.candidates, files, conflicts }
  const token = createHash('sha256').update(JSON.stringify(snapshot)).digest('hex')
  const updates = files.filter((file) => ['create', 'update', 'update-version'].includes(file.action)).length
  return { root: '.', discovery, files, conflicts, token, summary: updates + ' context file(s) to create or update, ' + (files.length - updates) + ' skipped/protected/conflicting. Nothing was written.' }
}

export async function contextUpdateApply(rootPath: string, token: string, confirmed: boolean, force = false): Promise<{ updated: string[]; skipped: string[]; conflicts: string[] }> {
  if (!confirmed) throw new Error('Context update requires confirmed: true')
  const root = await realpath(resolve(rootPath))
  const preview = await contextUpdatePreview(root)
  if (!token || token !== preview.token) throw new Error('Context update requires the exact current preview token')
  if (preview.conflicts.length > 0 && !force) throw new Error('Context update preview contains unresolved local modifications')
  if (preview.discovery.status !== 'resolved') throw new Error('Context update requires a uniquely selected context layout')
  const desired = await desiredFiles(root, preview.discovery)
  const byPath = new Map<string, string>()
  for (const item of desired) byPath.set(item.path, await contextUpdateContent(root, preview.discovery, item.path, item.content))
  const manifest = await loadManifest(root)
  const updated: string[] = []
  const skipped: string[] = []
  const conflicts: string[] = []
  for (const item of preview.files) {
    if (item.action === 'protected' || item.action === 'skip') {
      skipped.push(item.path)
      continue
    }
    if (item.action === 'conflict' && !force) {
      conflicts.push(item.path)
      continue
    }
    if (item.action === 'conflict' && force) {
      if (protectedTarget(item.path, preview.discovery.protectedPaths)) {
        conflicts.push(item.path)
        continue
      }
    }
    const content = byPath.get(item.path)
    if (content === undefined || item.sha256 === undefined) throw new Error('Context update source missing for ' + item.path)
    const currentInfo = await pathInfo(root, item.path)
    if (currentInfo.unsafe) throw new Error(currentInfo.unsafe)
    if (currentInfo.exists && currentInfo.kind !== 'file') throw new Error('Context update target is not a regular file: ' + item.path)
    if (currentInfo.exists && item.action !== 'update-version' && !force && await sha256(await readSafe(root, item.path)) !== (manifest.files[item.path]?.sha256 ?? item.sha256)) {
      throw new Error('Context update target changed after preview: ' + item.path)
    }
    manifest.files[item.path] = { sha256: item.sha256, status: 'pending' }
    await writeSafe(root, MANIFEST, JSON.stringify(manifest, null, 2) + NL)
    await writeSafe(root, item.path, content)
    manifest.files[item.path] = { sha256: item.sha256, status: 'complete' }
    await writeSafe(root, MANIFEST, JSON.stringify(manifest, null, 2) + NL)
    updated.push(item.path)
  }
  return { updated, skipped, conflicts }
}
