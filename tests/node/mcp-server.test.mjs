import assert from 'node:assert/strict'
import { mkdtemp, readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { bootstrap } from '../../dist/installer.js'
import { createCsdServer } from '../../dist/mcp/server.js'
import test from 'node:test'

const VALID_WORK_ITEM = (id) => JSON.stringify({
  schema_version: '1.0',
  id,
  title: 'Test work item',
  track: 'product',
  type: 'feature',
  phase: 'specify',
  status: 'active',
  risk: 'low',
  owner: 'tester',
  conversation_profile: 'senior-software-engineer',
  last_updated: '2026-09-21',
}, null, 2)

async function fixtureRepo(prefix = 'csd-mcp-') {
  const temp = await mkdtemp(join(tmpdir(), prefix))
  await bootstrap(temp)
  await mkdir(join(temp, '.context', 'work'), { recursive: true })
  return temp
}

async function seedWorkItem(temp, id, content = VALID_WORK_ITEM(id)) {
  await mkdir(join(temp, '.context', 'work', id), { recursive: true })
  await writeFile(join(temp, '.context', 'work', id, 'work-item.json'), content)
}

async function connect(pinnedRoot) {
  const server = createCsdServer(pinnedRoot)
  const client = new Client({ name: 'test', version: '0.0.0' })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  return client
}

function payload(result) {
  assert.equal(result.isError, undefined, `unexpected tool error: ${result.content[0]?.text}`)
  return result.structuredContent
}

test('mcp server exposes the seven CSD tools', async () => {
  const client = await connect()
  try {
    const tools = await client.listTools()
    assert.deepEqual(
      tools.tools.map((tool) => tool.name).sort(),
      ['csd_bootstrap_apply', 'csd_bootstrap_preview', 'csd_context', 'csd_inspect', 'csd_validate', 'csd_work_item', 'csd_write_artifact'],
    )
  } finally {
    await client.close()
  }
})

test('csd_inspect reports an initialized repository and its work items', async () => {
  const temp = await fixtureRepo('csd-mcp-inspect-')
  const client = await connect(temp)
  try {
    const report = payload(await client.callTool({ name: 'csd_inspect', arguments: {} }))
    assert.equal(report.exists, true)
    assert.equal(report.hasAgentsMd, true)
    assert.equal(report.hasContext, true)
    assert.equal(report.needsBootstrap, false)
    assert.equal(report.csdInstalled, false)
    await seedWorkItem(temp, 'FEAT-1234')
    const again = payload(await client.callTool({ name: 'csd_inspect', arguments: {} }))
    assert.equal(again.workItems.length, 1)
    assert.equal(again.workItems[0].id, 'FEAT-1234')
  } finally {
    await client.close()
    await rm(temp, { recursive: true, force: true })
  }
})

test('csd_context returns bootstrap pointers, references and open work items', async () => {
  const temp = await fixtureRepo('csd-mcp-context-')
  const client = await connect(temp)
  try {
    await seedWorkItem(temp, 'FEAT-2000')
    const result = payload(await client.callTool({
      name: 'csd_context',
      arguments: { request: 'add a feature', paths: ['prompts/intake.md'] },
    }))
    const bootstrapPaths = result.bootstrap.map((file) => file.path)
    for (const expected of ['AGENTS.md', '.context/INDEX.md', '.context/interaction/README.md', '.context/context-routing/catalog.md']) {
      assert.ok(bootstrapPaths.includes(expected), `bootstrap missing ${expected}`)
    }
    assert.ok(result.references.some((reference) => reference.path === '.context/workflows/core.md'))
    assert.deepEqual(result.openWorkItems.map((item) => item.id), ['FEAT-2000'])
    assert.equal(result.additional.length, 1)
    assert.match(result.additional[0].content, /intake/i)
    assert.equal(result.request, 'add a feature')
  } finally {
    await client.close()
    await rm(temp, { recursive: true, force: true })
  }
})

test('csd_work_item returns durable state without inventing anything', async () => {
  const temp = await fixtureRepo('csd-mcp-workitem-')
  const client = await connect(temp)
  try {
    await seedWorkItem(temp, 'FEAT-3000')
    await writeFile(join(temp, '.context', 'work', 'FEAT-3000', 'spec.md'), '# Spec\n\nObjective.\n')
    const detail = payload(await client.callTool({ name: 'csd_work_item', arguments: { id: 'FEAT-3000' } }))
    assert.equal(detail.valid, true)
    assert.equal(detail.metadata.phase, 'specify')
    assert.ok(detail.artifacts.includes('spec.md'))
    const listed = payload(await client.callTool({ name: 'csd_work_item', arguments: {} }))
    assert.deepEqual(listed.workItems.map((item) => item.id), ['FEAT-3000'])
  } finally {
    await client.close()
    await rm(temp, { recursive: true, force: true })
  }
})

test('csd_write_artifact persists allowlisted artifacts atomically', async () => {
  const temp = await fixtureRepo('csd-mcp-write-')
  const client = await connect(temp)
  try {
    await seedWorkItem(temp, 'FEAT-4000')
    const written = payload(await client.callTool({
      name: 'csd_write_artifact',
      arguments: { workItem: 'FEAT-4000', artifact: 'spec.md', content: '# Spec\n\nScope.\n' },
    }))
    assert.equal(written.path, join('.context', 'work', 'FEAT-4000', 'spec.md'))
    assert.equal(await readFile(join(temp, '.context', 'work', 'FEAT-4000', 'spec.md'), 'utf8'), '# Spec\n\nScope.\n')
    const entries = await readdir(join(temp, '.context', 'work', 'FEAT-4000'))
    assert.ok(entries.every((entry) => !entry.endsWith('.tmp')), 'temporary files must not survive')
    // work item creation through the allowlisted work-item.json artifact
    const created = payload(await client.callTool({
      name: 'csd_write_artifact',
      arguments: { workItem: 'FEAT-4001', artifact: 'work-item.json', content: VALID_WORK_ITEM('FEAT-4001') },
    }))
    assert.equal(created.artifact, 'work-item.json')
  } finally {
    await client.close()
    await rm(temp, { recursive: true, force: true })
  }
})

test('csd_write_artifact validates work-item.json structure', async () => {
  const temp = await fixtureRepo('csd-mcp-schema-')
  const client = await connect(temp)
  try {
    const bad = await client.callTool({
      name: 'csd_write_artifact',
      arguments: {
        workItem: 'FEAT-5000',
        artifact: 'work-item.json',
        content: JSON.stringify({ schema_version: '1.0', id: 'FEAT-5000', phase: 'not-a-phase' }),
      },
    })
    assert.equal(bad.isError, true)
    const body = JSON.parse(bad.content[0].text)
    assert.equal(body.code, 'WORK_ITEM_INVALID')
    assert.ok(body.details.errors.length > 0)
    const mismatched = await client.callTool({
      name: 'csd_write_artifact',
      arguments: { workItem: 'FEAT-5000', artifact: 'work-item.json', content: VALID_WORK_ITEM('FEAT-9999') },
    })
    assert.match(JSON.parse(mismatched.content[0].text).details.errors.join(' '), /directory/)
  } finally {
    await client.close()
    await rm(temp, { recursive: true, force: true })
  }
})

test('csd_validate runs the canonical validator and returns structured results', async () => {
  const temp = await fixtureRepo('csd-mcp-validate-')
  const client = await connect(temp)
  try {
    const report = payload(await client.callTool({ name: 'csd_validate', arguments: { strict: false } }))
    assert.equal(report.ran, true)
    assert.equal(typeof report.ok, 'boolean')
    assert.ok(Array.isArray(report.errors) && Array.isArray(report.warnings))
    assert.match(report.command, /validate_context\.py/)
    // an uninitialized repository surfaces validator findings instead of success
    const bare = await mkdtemp(join(tmpdir(), 'csd-mcp-bare-'))
    try {
      const client2 = await connect(bare)
      try {
        const failing = payload(await client2.callTool({ name: 'csd_validate', arguments: {} }))
        assert.equal(failing.ran, true)
        assert.equal(failing.ok, false)
        assert.ok(failing.errors.length > 0)
      } finally {
        await client2.close()
      }
    } finally {
      await rm(bare, { recursive: true, force: true })
    }
  } finally {
    await client.close()
    await rm(temp, { recursive: true, force: true })
  }
})

test('bootstrap through MCP requires preview then apply with the exact token', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'csd-mcp-gate-'))
  const client = await connect(temp)
  try {
    const gated = await client.callTool({ name: 'csd_bootstrap_apply', arguments: { token: 'a'.repeat(64), confirmed: true } })
    assert.equal(gated.isError, true)
    assert.equal(JSON.parse(gated.content[0].text).code, 'BOOTSTRAP_GATE')
    const preview = payload(await client.callTool({ name: 'csd_bootstrap_preview', arguments: {} }))
    assert.match(preview.summary, /Nothing was written/)
    assert.ok(await readdir(join(temp, '.context')).catch(() => null) === null, 'preview must not create .context')
    const applied = payload(await client.callTool({ name: 'csd_bootstrap_apply', arguments: { token: preview.token, confirmed: true } }))
    assert.ok(applied.created.includes('.context/INDEX.md'))
    const reinspection = payload(await client.callTool({ name: 'csd_inspect', arguments: {} }))
    assert.equal(reinspection.needsBootstrap, false)
  } finally {
    await client.close()
    await rm(temp, { recursive: true, force: true })
  }
})

test('cross-agent handoff: work item created over MCP is readable from the filesystem', async () => {
  const temp = await fixtureRepo('csd-mcp-handoff-')
  const client = await connect(temp)
  try {
    payload(await client.callTool({
      name: 'csd_write_artifact',
      arguments: { workItem: 'FEAT-8100', artifact: 'work-item.json', content: VALID_WORK_ITEM('FEAT-8100') },
    }))
    payload(await client.callTool({
      name: 'csd_write_artifact',
      arguments: { workItem: 'FEAT-8100', artifact: 'spec.md', content: '# Spec\n\n## Decisions\n\nD1: use sqlite.\n' },
    }))
    // the MCP session disappears; a different agent (e.g. Codex via $csd) reads
    // the durable state with plain filesystem reads, no MCP involved
    await client.close()
    const metadata = JSON.parse(await readFile(join(temp, '.context', 'work', 'FEAT-8100', 'work-item.json'), 'utf8'))
    assert.equal(metadata.phase, 'specify')
    assert.match(await readFile(join(temp, '.context', 'work', 'FEAT-8100', 'spec.md'), 'utf8'), /use sqlite/)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})
