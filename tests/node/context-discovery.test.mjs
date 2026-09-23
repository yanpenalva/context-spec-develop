import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { bootstrapApply, bootstrapPreview, discoverContext, moduleContextApply, moduleContextPreview, registerContextAdapter, writeContextFile } from '../../dist/context.js'
import { bootstrap, update } from '../../dist/installer.js'
import { bootstrapApply as applyMcpBootstrap, bootstrapPreview as previewMcpBootstrap, collectContext, inspectRepository, readWorkItem, writeArtifact } from '../../dist/mcp/repository.js'

async function temporary(prefix) {
  return mkdtemp(join(tmpdir(), prefix))
}

async function createLayout(root, layout) {
  const base = join(root, layout)
  if (layout === '.context') {
    await mkdir(join(base, 'context-routing'), { recursive: true })
    await writeFile(join(base, 'INDEX.md'), '# context\n')
  } else if (layout === '.ai') {
    await mkdir(join(base, 'tasks'), { recursive: true })
    await writeFile(join(base, 'README.md'), '# ai context\n')
  } else if (layout === '.agents') {
    await mkdir(join(base, 'context'), { recursive: true })
  } else if (layout === 'docs/context') {
    await mkdir(join(base, 'routing'), { recursive: true })
    await writeFile(join(base, 'INDEX.md'), '# docs context\n')
  } else {
    await mkdir(join(base, 'work'), { recursive: true })
    await writeFile(join(base, 'README.md'), '# context\n')
  }
}

function rootConfig(contextDiscovery) {
  return JSON.stringify({ contextDiscovery }, null, 2) + '\n'
}

test('discovers every supported marker layout with stable relative paths', async () => {
  const root = await temporary('csd-layouts-')
  try {
    const layouts = ['.context', '.ai', '.agents', 'docs/context', 'context']
    for (const layout of layouts) {
      const repo = join(root, layout.replaceAll('/', '-'))
      await mkdir(repo, { recursive: true })
      await createLayout(repo, layout)
      const first = await discoverContext(repo)
      const second = await discoverContext(repo)
      assert.equal(first.status, 'resolved', layout)
      assert.equal(first.layout, layout)
      assert.deepEqual(first, second)
      assert.equal(first.root, '.')
      assert.ok(first.candidates.every((candidate) => !candidate.path.startsWith('/')))
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('native repository discovery permits the documented shared validator fallback', async () => {
  const result = await discoverContext(process.cwd())
  assert.equal(result.status, 'resolved')
  assert.equal(result.layout, '.context')
  assert.equal(result.paths.validator, 'scripts/validate_context.py')
})

test('reports candidate conflicts and uses precedence only when explicitly enabled', async () => {
  const root = await temporary('csd-precedence-')
  try {
    await createLayout(root, '.context')
    await createLayout(root, '.ai')
    await writeFile(join(root, '.context', 'config.json'), '{ invalid candidate config')
    await writeFile(join(root, '.ai', 'config.json'), '{ invalid candidate config')
    const conflict = await discoverContext(root)
    assert.equal(conflict.status, 'conflict')
    assert.match(conflict.conflicts[0], /multiple valid/)
    await writeFile(join(root, 'csd.config.json'), rootConfig({
      enabledAdapters: ['.context', '.ai'],
      adapterPrecedence: ['.ai', '.context'],
      resolveMultipleCandidatesSilently: true,
      canonicalLayout: '.context',
    }))
    const selected = await discoverContext(root)
    assert.equal(selected.status, 'invalid')
    assert.match(selected.conflicts[0], /Invalid|JSON/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('invalid root configuration and symlinked candidate roots never fall back or write', async () => {
  const root = await temporary('csd-invalid-')
  const target = await temporary('csd-link-target-')
  try {
    await writeFile(join(root, 'csd.config.json'), '{')
    const invalidConfig = await discoverContext(root)
    assert.equal(invalidConfig.status, 'invalid')
    assert.equal((await bootstrapPreview(root)).files.length, 0)
    await rm(join(root, 'csd.config.json'))
    await symlink(target, join(root, '.context'))
    const unsafe = await discoverContext(root)
    assert.equal(unsafe.status, 'invalid')
    assert.match(unsafe.conflicts.join(' '), /symlink/)
    assert.equal((await readdir(target)).length, 0)
  } finally {
    await rm(root, { recursive: true, force: true })
    await rm(target, { recursive: true, force: true })
  }
})

test('configured code integrations can only add observer warnings and reported protections', async () => {
  const root = await temporary('csd-observer-')
  try {
    await createLayout(root, '.ai')
    await writeFile(join(root, 'csd.config.json'), rootConfig({
      enabledAdapters: ['.ai'],
      canonicalLayout: '.ai',
      optionalFrameworkIntegrations: ['framework-check'],
    }))
    const result = await discoverContext(root, {
      integrations: [{
        id: 'framework-check',
        detect: async () => ({ detected: true, warnings: ['framework observed'], protectedPaths: ['generated/framework'], onboardingHint: 'review framework docs', validation: { ok: false } }),
      }],
    })
    assert.equal(result.status, 'resolved')
    assert.equal(result.layout, '.ai')
    assert.ok(result.protectedPaths.includes('generated/framework'))
    assert.ok(result.warnings.some((warning) => warning === 'framework observed'))
    assert.ok(result.warnings.some((warning) => warning.includes('validation failure')))
    assert.ok(result.warnings.some((warning) => warning.includes('onboarding hint')))
    const notEnabled = await discoverContext(root, {
      integrations: [{ id: 'other', detect: async () => ({ warnings: ['must not run'] }) }],
    })
    assert.equal(notEnabled.warnings.length, 0)
    assert.equal(notEnabled.layout, '.ai')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('unsafe configured marker paths return invalid without fallback', async () => {
  const root = await temporary('csd-marker-config-')
  try {
    await writeFile(join(root, 'csd.config.json'), rootConfig({
      enabledAdapters: ['.context'],
      canonicalLayout: '.context',
      markerRules: { '.context': { allOf: ['../outside.md'] } },
    }))
    const result = await discoverContext(root)
    assert.equal(result.status, 'invalid')
    assert.match(result.conflicts.join(' '), /invalid rule|unsafe marker|unsafe path/)
    assert.equal((await readdir(root)).length, 1)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('code-registered context adapters use the same discovery and bootstrap contract', async () => {
  const adapterRoot = 'context-extra'
  const unregister = registerContextAdapter({
    id: 'example-context',
    root: adapterRoot,
    mode: 'compatibility',
    markerRules: { allOf: ['README.md'], anyOf: [['workflow.md']] },
    resolve: async () => ({
      paths: {
        root: adapterRoot,
        index: adapterRoot + '/README.md',
        workflow: adapterRoot + '/workflow.md',
        routing: adapterRoot + '/context-routing',
        work: adapterRoot + '/work',
        templates: adapterRoot + '/templates',
        scripts: adapterRoot + '/scripts',
        onboarding: undefined,
        onboardingSources: [],
        config: adapterRoot + '/config.json',
        validator: undefined,
      },
      missing: ['routing', 'work', 'templates', 'scripts', 'onboarding', 'validator'],
    }),
    mapBootstrapPath: (source) => adapterRoot + '/' + (source === 'INDEX.md' ? 'README.md' : source),
    transformTemplate: (content) => content.replaceAll('.context/INDEX.md', adapterRoot + '/README.md').replaceAll('.context', adapterRoot),
  })
  const root = await temporary('csd-custom-adapter-')
  try {
    await writeFile(join(root, 'csd.config.json'), rootConfig({ enabledAdapters: ['example-context'], canonicalLayout: 'example-context' }))
    await mkdir(join(root, adapterRoot), { recursive: true })
    await writeFile(join(root, adapterRoot, 'README.md'), '# custom context')
    await writeFile(join(root, adapterRoot, 'workflow.md'), '# workflow')
    const selected = await discoverContext(root)
    assert.equal(selected.status, 'resolved')
    assert.equal(selected.layout, 'example-context')
    assert.equal(selected.mode, 'compatibility')
    assert.equal(selected.paths.root, adapterRoot)
    const existing = await bootstrapPreview(root)
    assert.equal(existing.files.length, 0)

    const empty = await temporary('csd-custom-bootstrap-')
    try {
      await writeFile(join(empty, 'csd.config.json'), rootConfig({ enabledAdapters: ['example-context'], canonicalLayout: 'example-context' }))
      const preview = await bootstrapPreview(empty)
      assert.equal(preview.discovery.status, 'bootstrap_required')
      assert.ok(preview.files.some((file) => file.path === adapterRoot + '/README.md'))
      await bootstrapApply(empty, preview.token, true)
      assert.equal((await discoverContext(empty)).layout, 'example-context')
      await assert.rejects(readFile(join(empty, '.context', 'INDEX.md')))
    } finally {
      await rm(empty, { recursive: true, force: true })
    }
  } finally {
    unregister()
    await rm(root, { recursive: true, force: true })
  }
})

test('selected work-item patterns are bounded and reject ambiguous backtracking', async () => {
  const root = await temporary('csd-pattern-')
  try {
    await createLayout(root, '.context')
    await mkdir(join(root, '.context'), { recursive: true })
    await writeFile(join(root, '.context', 'config.json'), JSON.stringify({ work_item_id_pattern: '^[ab]*a[ab]*z$' }))
    const invalid = await discoverContext(root)
    assert.equal(invalid.status, 'invalid')
    assert.match(invalid.conflicts.join(' '), /ambiguous/)
    await writeFile(join(root, '.context', 'config.json'), JSON.stringify({ work_item_id_pattern: '^[ab]*-[ab]*$' }))
    const safe = await discoverContext(root)
    assert.equal(safe.status, 'resolved')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('preview is read-only, apply requires confirmation, and retries complete pending ownership', async () => {
  const root = await temporary('csd-bootstrap-preview-')
  try {
    const preview = await bootstrapPreview(root)
    assert.equal(preview.discovery.status, 'bootstrap_required')
    assert.ok(preview.files.some((file) => file.path === '.csd-bootstrap.json'))
    assert.equal(preview.root, '.')
    await assert.rejects(bootstrapApply(root, preview.token, false), /confirmed: true/)
    assert.deepEqual(await readdir(root), [])

    const packaged = await readFile('assets/template/.context/INDEX.md', 'utf8')
    const digest = createHash('sha256').update(packaged).digest('hex')
    await mkdir(join(root, '.context'), { recursive: true })
    await writeFile(join(root, '.context', 'INDEX.md'), packaged)
    await writeFile(join(root, '.csd-bootstrap.json'), JSON.stringify({
      schemaVersion: 1,
      owner: '@owlcodium/context-spec-develop',
      files: { '.context/INDEX.md': { sha256: digest, status: 'pending' } },
    }))
    const retryPreview = await bootstrapPreview(root)
    assert.equal(retryPreview.files.find((file) => file.path === '.context/INDEX.md').action, 'skip')
    assert.match(retryPreview.files.find((file) => file.path === '.context/INDEX.md').reason, /pending/)
    await bootstrapApply(root, retryPreview.token, true)
    const manifest = JSON.parse(await readFile(join(root, '.csd-bootstrap.json'), 'utf8'))
    assert.equal(manifest.files['.context/INDEX.md'].status, 'complete')
    assert.equal((await discoverContext(root)).status, 'resolved')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('unowned collisions and protected paths are visible and preserved', async () => {
  const root = await temporary('csd-bootstrap-collision-')
  try {
    const protectedContent = 'user policy\n'
    await mkdir(join(root, '.context', 'policies'), { recursive: true })
    await writeFile(join(root, '.context', 'INDEX.md'), 'user index\n')
    await writeFile(join(root, '.context', 'policies', 'README.md'), protectedContent)
    await writeFile(join(root, 'csd.config.json'), rootConfig({
      enabledAdapters: ['.context'],
      canonicalLayout: '.context',
      protectedPaths: ['.context/policies'],
    }))
    const preview = await bootstrapPreview(root)
    assert.ok(preview.files.some((file) => file.path === '.context/INDEX.md' && file.action === 'conflict'))
    assert.ok(preview.files.some((file) => file.path === '.context/policies/README.md' && file.action === 'protected'))
    assert.ok(preview.conflicts.length > 0)
    assert.equal(await readFile(join(root, '.context', 'policies', 'README.md'), 'utf8'), protectedContent)
    await assert.rejects(bootstrapApply(root, preview.token, true), /conflict/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('canonical .ai bootstrap stays in its layout and MCP routes work items there', async () => {
  const root = await temporary('csd-ai-bootstrap-')
  try {
    await writeFile(join(root, 'csd.config.json'), rootConfig({ canonicalLayout: '.ai' }))
    const preview = await bootstrapPreview(root)
    assert.ok(preview.files.some((file) => file.path === '.ai/README.md' && file.action === 'create'))
    await bootstrapApply(root, preview.token, true)
    const discovery = await discoverContext(root)
    assert.equal(discovery.status, 'resolved')
    assert.equal(discovery.layout, '.ai')
    assert.equal(discovery.paths.work, '.ai/tasks')
    await assert.rejects(readFile(join(root, '.context', 'INDEX.md')))
    const inspection = await inspectRepository(root)
    assert.equal(inspection.needsBootstrap, false)
    assert.equal(inspection.contextLayout, '.ai')
    const metadata = {
      schema_version: '1.0', id: 'FEAT-82', title: 'AI adapter item', track: 'product',
      type: 'feature', phase: 'discover', status: 'draft', risk: 'low', owner: 'test',
      conversation_profile: 'default', last_updated: '2026-09-23',
    }
    const written = await writeArtifact(root, 'FEAT-82', 'work-item.json', JSON.stringify(metadata))
    assert.equal(written.path, '.ai/tasks/FEAT-82/work-item.json')
    assert.equal((await readWorkItem(root, 'FEAT-82')).valid, true)
    const context = await collectContext(root)
    assert.ok(context.bootstrap.some((file) => file.path === '.ai/README.md'))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('protected paths reject artifact-style writes', async () => {
  const root = await temporary('csd-protected-write-')
  try {
    await createLayout(root, '.context')
    await writeFile(join(root, 'csd.config.json'), rootConfig({
      enabledAdapters: ['.context'],
      canonicalLayout: '.context',
      protectedPaths: ['.context/work'],
    }))
    await assert.rejects(writeContextFile(root, '.context/work/FEAT-1/progress.md', 'should not write'), /protected context path/)
    await assert.rejects(readFile(join(root, '.context/work/FEAT-1/progress.md')))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('MCP context collection reads the selected adapter routing path and references', async () => {
  const root = await temporary('csd-normalized-routing-')
  try {
    await mkdir(join(root, '.agents', 'context', 'context-routing'), { recursive: true })
    await writeFile(join(root, '.agents', 'context', 'INDEX.md'), '# agent context')
    await writeFile(join(root, '.agents', 'context', 'workflow.md'), '# workflow')
    await writeFile(join(root, '.agents', 'context', 'context-routing', 'README.md'), '# routing')
    await writeFile(join(root, '.agents', 'context', 'context-routing', 'catalog.md'), '# catalog')
    const context = await collectContext(root)
    assert.ok(context.bootstrap.some((entry) => entry.path === '.agents/context/context-routing/README.md'))
    assert.ok(context.bootstrap.some((entry) => entry.path === '.agents/context/workflow.md'))
    assert.ok(context.references.some((entry) => entry.path === '.agents/context/workflow.md'))
    assert.ok(context.references.some((entry) => entry.path === '.agents/context/context-routing/README.md'))
    assert.ok(context.references.every((entry) => entry.path.startsWith('.agents/')))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('the existing direct MCP bootstrapApply call remains callable', async () => {
  const root = await temporary('csd-mcp-direct-bootstrap-')
  try {
    const preview = await previewMcpBootstrap(root)
    const result = await applyMcpBootstrap(root, preview.token)
    assert.ok(result.created.includes('.context/INDEX.md'))
    assert.equal((await discoverContext(root)).status, 'resolved')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('bootstrap materializes each configured compatibility layout without creating .context', async () => {
  for (const layout of ['.agents', 'docs/context', 'context']) {
    const root = await temporary('csd-canonical-layout-')
    try {
      await writeFile(join(root, 'csd.config.json'), rootConfig({ canonicalLayout: layout }))
      const preview = await bootstrapPreview(root)
      assert.equal(preview.discovery.status, 'bootstrap_required')
      await bootstrapApply(root, preview.token, true)
      const discovery = await discoverContext(root)
      assert.equal(discovery.status, 'resolved', layout)
      assert.equal(discovery.layout, layout)
      await assert.rejects(readFile(join(root, '.context', 'INDEX.md')))
      const noOp = await bootstrapPreview(root)
      assert.equal(noOp.discovery.status, 'resolved')
      assert.equal(noOp.files.length, 0)
      assert.deepEqual((await bootstrapApply(root, noOp.token, true)).created, [])
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  }
})

test('legacy bootstrap API is a no-op on an already valid compatibility layout', async () => {
  const root = await temporary('csd-api-noop-')
  try {
    await createLayout(root, '.agents')
    const report = await bootstrap(root)
    assert.deepEqual(report.created, [])
    assert.equal((await readdir(root)).includes('.context'), false)
    assert.equal((await discoverContext(root)).layout, '.agents')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('AGENTS merge ownership allows outside text edits while protecting the managed block', async () => {
  const root = await temporary('csd-agents-owned-')
  try {
    await writeFile(join(root, 'AGENTS.md'), '# Local agent rules\n\nKeep this section.\n')
    await bootstrap(root)
    const agentPath = join(root, 'AGENTS.md')
    const changedOutside = (await readFile(agentPath, 'utf8')).replace('# Local agent rules', '# Updated local agent rules')
    await writeFile(agentPath, changedOutside)
    await rm(join(root, '.context', 'context-routing'), { recursive: true, force: true })
    const preview = await bootstrapPreview(root)
    assert.equal(preview.discovery.status, 'bootstrap_required')
    assert.equal(preview.files.find((file) => file.path === 'AGENTS.md').action, 'skip')
    assert.match(preview.files.find((file) => file.path === 'AGENTS.md').reason, /managed block is unchanged/)
    await bootstrapApply(root, preview.token, true)
    const result = await readFile(agentPath, 'utf8')
    assert.match(result, /Updated local agent rules/)
    assert.match(result, /CSD:BEGIN/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('malformed ownership manifests are preview conflicts and do not write', async () => {
  const root = await temporary('csd-manifest-invalid-')
  try {
    await writeFile(join(root, '.csd-bootstrap.json'), '{')
    const preview = await bootstrapPreview(root)
    assert.ok(preview.conflicts.some((item) => item.includes('.csd-bootstrap.json')))
    assert.equal(preview.files[0].action, 'conflict')
    assert.equal((await readdir(root)).length, 1)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('CLI bootstrap previews by default and dry-run prevents writes even with --yes', async () => {
  const root = await temporary('csd-cli-preview-')
  try {
    const run = (args) => spawnSync(process.execPath, ['dist/cli.js', 'bootstrap', '--root', root, ...args], {
      encoding: 'utf8',
      env: { ...process.env, CSD_NON_INTERACTIVE: '1' },
    })
    assert.equal(run([]).status, 0)
    assert.equal((await readdir(root)).length, 0)
    assert.equal(run(['--yes', '--dry-run']).status, 0)
    assert.equal((await readdir(root)).length, 0)
    assert.equal(run(['--yes']).status, 0)
    assert.equal((await discoverContext(root)).status, 'resolved')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('module context discovery previews generic scaffold and is idempotent after apply', async () => {
  const root = await temporary('csd-module-context-')
  try {
    await createLayout(root, '.context')
    const initial = await discoverContext(root)
    assert.equal(initial.module_context.status, 'missing')
    assert.equal(initial.module_context.needs_prompt, true)

    const preview = await moduleContextPreview(root)
    assert.equal(preview.conflicts.length, 0)
    assert.ok(preview.files.some((file) => file.path === '.context/project/modules/README.md' && file.action === 'create'))
    assert.equal((await readdir(root)).includes('.context/.csd-module-context.json'), false)

    const applied = await moduleContextApply(root, preview.token, true)
    assert.ok(applied.created.includes('.context/project/modules/README.md'))
    assert.ok(applied.created.includes('.context/project/modules/_module-template.md'))
    assert.ok(applied.created.includes('.context/.csd-module-context.json'))

    const after = await discoverContext(root)
    assert.equal(after.module_context.status, 'found')
    assert.equal(after.module_context.needs_prompt, false)
    const repeat = await moduleContextPreview(root)
    assert.deepEqual(repeat.files, [])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('module context discovery preserves compatibility documentation and does not prompt', async () => {
  const root = await temporary('csd-module-found-')
  try {
    await createLayout(root, '.context')
    await mkdir(join(root, '.ai', 'modules'), { recursive: true })
    await writeFile(join(root, '.ai', 'modules', 'orders.md'), '# Orders\n')
    const found = await discoverContext(root)
    assert.equal(found.module_context.status, 'found')
    assert.equal(found.module_context.needs_prompt, false)
    assert.deepEqual(found.module_context.module_files, ['.ai/modules/orders.md'])
    const preview = await moduleContextPreview(root)
    assert.deepEqual(preview.files, [])
    assert.equal(await readFile(join(root, '.ai', 'modules', 'orders.md'), 'utf8'), '# Orders\n')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('module context decline is persisted without creating a scaffold', async () => {
  const root = await temporary('csd-module-decline-')
  try {
    await createLayout(root, '.context')
    const preview = await moduleContextPreview(root)
    await moduleContextApply(root, preview.token, true, true)
    const declined = await discoverContext(root)
    assert.equal(declined.module_context.status, 'declined')
    assert.equal(declined.module_context.needs_prompt, false)
    await assert.rejects(readFile(join(root, '.context', 'project', 'modules', 'README.md')))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('installer update preserves local edits unless force is explicit', async () => {
  const root = await temporary('csd-update-')
  try {
    const installer = await import('../../dist/installer.js')
    await installer.install({ scope: 'project', agents: ['cursor'], root, force: false })
    const commandPath = join(root, '.cursor', 'commands', 'csd.md')
    await writeFile(commandPath, '# local command\n')
    await assert.rejects(update('project', root, false), /locally modified files/)
    const forced = await update('project', root, true)
    assert.ok(forced.warnings.some((warning) => warning.includes('locally modified')))
    assert.match(await readFile(commandPath, 'utf8'), /CSD bootstrap protocol/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('CLI package update dry-run is read-only', async () => {
  const root = await temporary('csd-cli-update-preview-')
  try {
    const installer = await import('../../dist/installer.js')
    await installer.install({ scope: 'project', agents: ['cursor'], root, force: false })
    const commandPath = join(root, '.cursor', 'commands', 'csd.md')
    const before = await readFile(commandPath, 'utf8')
    await writeFile(commandPath, '# local command\n')
    const run = spawnSync(process.execPath, ['dist/cli.js', 'update', '--scope', 'project', '--root', root, '--dry-run'], { encoding: 'utf8', env: { ...process.env, CSD_NON_INTERACTIVE: '1' } })
    assert.equal(run.status, 1)
    assert.match(run.stdout, /locally modified|conflict/i)
    assert.equal(await readFile(commandPath, 'utf8'), '# local command\n')
    assert.notEqual(before, await readFile(commandPath, 'utf8'))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('context update previews and applies only CSD-owned unchanged files', async () => {
  const root = await temporary('csd-context-update-')
  try {
    await bootstrap(root)
    const context = await import('../../dist/context.js')
    const preview = await context.contextUpdatePreview(root)
    assert.equal(preview.discovery.status, 'resolved')
    assert.ok(preview.files.some((file) => file.action === 'skip'))
    const applied = await context.contextUpdateApply(root, preview.token, true)
    assert.deepEqual(applied.conflicts, [])
    assert.deepEqual(applied.updated, ['.context/config.json'])

    const localPath = join(root, '.context', 'INDEX.md')
    await writeFile(localPath, '# Local context\n')
    const conflict = await context.contextUpdatePreview(root)
    assert.ok(conflict.conflicts.some((item) => item.includes('.context/INDEX.md')))
    await assert.rejects(context.contextUpdateApply(root, conflict.token, true), /unresolved local modifications/)
    assert.equal(await readFile(localPath, 'utf8'), '# Local context\n')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('context update protects project-owned context and merges only kit_version', async () => {
  const root = await temporary('csd-context-owned-')
  try {
    await bootstrap(root)
    const configPath = join(root, '.context', 'config.json')
    const overviewPath = join(root, '.context', 'project', 'overview.md')
    const config = JSON.parse(await readFile(configPath, 'utf8'))
    config.kit_version = '0.9.0'
    config.project.name = 'Local project'
    await writeFile(configPath, JSON.stringify(config, null, 2) + '\n')
    await writeFile(overviewPath, '# Local overview\n')
    const context = await import('../../dist/context.js')
    const preview = await context.contextUpdatePreview(root)
    assert.ok(preview.files.some((file) => file.path === '.context/project/overview.md' && file.action === 'protected'))
    assert.ok(preview.files.some((file) => file.path === '.context/config.json' && file.action === 'update-version'))
    const applied = await context.contextUpdateApply(root, preview.token, true)
    assert.deepEqual(applied.conflicts, [])
    assert.equal(JSON.parse(await readFile(configPath, 'utf8')).project.name, 'Local project')
    assert.equal(await readFile(overviewPath, 'utf8'), '# Local overview\n')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('CLI exposes module scaffold and context update commands', async () => {
  const root = await temporary('csd-cli-maintenance-')
  try {
    await spawnSync(process.execPath, ['dist/cli.js', 'bootstrap', '--root', root, '--yes'], {
      encoding: 'utf8',
      env: { ...process.env, CSD_NON_INTERACTIVE: '1' },
    })
    const run = (args) => spawnSync(process.execPath, ['dist/cli.js', ...args], {
      encoding: 'utf8',
      env: { ...process.env, CSD_NON_INTERACTIVE: '1' },
    })
    const modulePreview = run(['modules', '--root', root, '--preview'])
    assert.equal(modulePreview.status, 0)
    assert.match(modulePreview.stdout, /module-context file\(s\) to create/)
    const moduleApply = run(['modules', '--root', root, '--yes'])
    assert.equal(moduleApply.status, 0)
    assert.ok(await readFile(join(root, '.context', 'project', 'modules', '_module-template.md'), 'utf8'))

    await bootstrap(root)
    const updatePreview = run(['update', '--context', '--root', root, '--dry-run'])
    assert.equal(updatePreview.status, 0)
    assert.ok(updatePreview.stdout.includes('context file(s) to create or update'))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
