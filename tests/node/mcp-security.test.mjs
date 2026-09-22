import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { bootstrap } from '../../dist/installer.js'
import { createCsdServer } from '../../dist/mcp/server.js'
import { ARTIFACT_ALLOWLIST } from '../../dist/mcp/repository.js'
import test from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '..', '..')

async function fixtureRepo(prefix = 'csd-mcp-sec-') {
  const temp = await mkdtemp(join(tmpdir(), prefix))
  await bootstrap(temp)
  await mkdir(join(temp, '.context', 'work'), { recursive: true })
  return temp
}

async function seedWorkItem(temp, id = 'FEAT-6000') {
  await mkdir(join(temp, '.context', 'work', id), { recursive: true })
  await writeFile(join(temp, '.context', 'work', id, 'work-item.json'), JSON.stringify({
    schema_version: '1.0', id, title: 'Security fixture', track: 'product', type: 'feature',
    phase: 'execute', status: 'active', risk: 'low', owner: 'tester',
    conversation_profile: 'senior-software-engineer', last_updated: '2026-09-21',
  }))
}

async function connect(pinnedRoot) {
  const server = createCsdServer(pinnedRoot)
  const client = new Client({ name: 'test', version: '0.0.0' })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  return client
}

async function errorCode(client, name, args) {
  const result = await client.callTool({ name, arguments: args })
  assert.equal(result.isError, true, `expected ${name} to fail`)
  return JSON.parse(result.content[0].text).code
}

async function snapshot(root) {
  const files = []
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      if (entry.isDirectory()) await visit(path)
      else files.push([path, await readFile(path).then((buffer) => buffer.byteLength)])
    }
  }
  await visit(root)
  return files.sort((a, b) => a[0].localeCompare(b[0]))
}

test('a server started with --root rejects every other root', async () => {
  const temp = await fixtureRepo()
  const other = await mkdtemp(join(tmpdir(), 'csd-mcp-other-'))
  const client = await connect(temp)
  try {
    assert.equal(await errorCode(client, 'csd_inspect', { root: other }), 'ROOT_MISMATCH')
    assert.equal(await errorCode(client, 'csd_context', { root: join(temp, '..') }), 'ROOT_MISMATCH')
    const ok = await client.callTool({ name: 'csd_inspect', arguments: { root: temp } })
    assert.equal(ok.isError, undefined)
  } finally {
    await client.close()
    await rm(temp, { recursive: true, force: true })
    await rm(other, { recursive: true, force: true })
  }
})

test('without a pinned root an absolute root is mandatory', async () => {
  const client = await connect()
  try {
    assert.equal(await errorCode(client, 'csd_inspect', {}), 'ROOT_REQUIRED')
    assert.equal(await errorCode(client, 'csd_inspect', { root: 'relative/path' }), 'ROOT_REQUIRED')
  } finally {
    await client.close()
  }
})

test('nonexistent and non-CSD repositories are reported, never created', async () => {
  const client = await connect()
  try {
    assert.equal(await errorCode(client, 'csd_inspect', { root: '/nonexistent/csd/repo' }), 'REPOSITORY_NOT_FOUND')
    const bare = await mkdtemp(join(tmpdir(), 'csd-mcp-bare-'))
    try {
      assert.equal(await errorCode(client, 'csd_context', { root: bare }), 'NOT_A_CSD_REPOSITORY')
      assert.equal(await errorCode(client, 'csd_write_artifact', { root: bare, workItem: 'FEAT-1', artifact: 'spec.md', content: 'x' }), 'NOT_A_CSD_REPOSITORY')
      assert.equal(await (await client.callTool({ name: 'csd_inspect', arguments: { root: bare } })).structuredContent.needsBootstrap, true)
    } finally {
      await rm(bare, { recursive: true, force: true })
    }
  } finally {
    await client.close()
  }
})

test('read-only tools never modify the repository', async () => {
  const temp = await fixtureRepo()
  await seedWorkItem(temp)
  const client = await connect(temp)
  try {
    const before = await snapshot(temp)
    await client.callTool({ name: 'csd_inspect', arguments: {} })
    await client.callTool({ name: 'csd_context', arguments: {} })
    await client.callTool({ name: 'csd_work_item', arguments: { id: 'FEAT-6000' } })
    await client.callTool({ name: 'csd_work_item', arguments: {} })
    await client.callTool({ name: 'csd_validate', arguments: { strict: false } })
    assert.deepEqual(await snapshot(temp), before)
  } finally {
    await client.close()
    await rm(temp, { recursive: true, force: true })
  }
})

test('artifact writes reject traversal, outside artifacts and unknown work items', async () => {
  const temp = await fixtureRepo()
  await seedWorkItem(temp)
  const client = await connect(temp)
  try {
    assert.equal(await errorCode(client, 'csd_write_artifact', { workItem: 'FEAT-6000', artifact: '../../evil.md', content: 'x' }), 'ARTIFACT_NOT_ALLOWED')
    assert.equal(await errorCode(client, 'csd_write_artifact', { workItem: 'FEAT-6000', artifact: 'AGENTS.md', content: 'x' }), 'ARTIFACT_NOT_ALLOWED')
    assert.equal(await errorCode(client, 'csd_write_artifact', { workItem: '../outside', artifact: 'spec.md', content: 'x' }), 'WORK_ITEM_INVALID')
    assert.equal(await errorCode(client, 'csd_write_artifact', { workItem: 'feet-6000', artifact: 'spec.md', content: 'x' }), 'WORK_ITEM_INVALID')
    assert.equal(await errorCode(client, 'csd_write_artifact', { workItem: 'FEAT-9999', artifact: 'spec.md', content: 'x' }), 'WORK_ITEM_NOT_FOUND')
    for (const artifact of ARTIFACT_ALLOWLIST) {
      assert.ok(/^[A-Za-z0-9._-]+$/.test(artifact), `allowlist entry must be a plain file name: ${artifact}`)
    }
  } finally {
    await client.close()
    await rm(temp, { recursive: true, force: true })
  }
})

test('symlink escapes are blocked on write paths', async () => {
  const temp = await fixtureRepo()
  const outside = await mkdtemp(join(tmpdir(), 'csd-mcp-outside-'))
  await seedWorkItem(temp)
  const client = await connect(temp)
  try {
    // work item directory itself is a symlink pointing outside the repository
    await rm(join(temp, '.context', 'work', 'FEAT-6000'), { recursive: true, force: true })
    await mkdir(join(outside, 'smuggled'), { recursive: true })
    await symlink(join(outside, 'smuggled'), join(temp, '.context', 'work', 'FEAT-6000'), 'dir')
    await writeFile(join(outside, 'smuggled', 'work-item.json'), JSON.stringify({ id: 'FEAT-6000' }))
    assert.equal(await errorCode(client, 'csd_write_artifact', { workItem: 'FEAT-6000', artifact: 'spec.md', content: 'x' }), 'PATH_ESCAPE')
    assert.equal(await readdir(join(outside, 'smuggled')).then((entries) => entries.includes('spec.md')), false)
  } finally {
    await client.close()
    await rm(temp, { recursive: true, force: true })
    await rm(outside, { recursive: true, force: true })
  }
})

test('malformed work items are flagged, never repaired', async () => {
  const temp = await fixtureRepo()
  const client = await connect(temp)
  try {
    await mkdir(join(temp, '.context', 'work', 'FEAT-7000'), { recursive: true })
    await writeFile(join(temp, '.context', 'work', 'FEAT-7000', 'work-item.json'), '{not json')
    const listed = (await client.callTool({ name: 'csd_work_item', arguments: {} })).structuredContent
    const broken = listed.workItems.find((item) => item.id === 'FEAT-7000')
    assert.equal(broken.valid, false)
    const detail = (await client.callTool({ name: 'csd_work_item', arguments: { id: 'FEAT-7000' } })).structuredContent
    assert.equal(detail.valid, false)
    assert.ok(detail.validationErrors.length > 0)
    assert.equal(detail.metadata, undefined)
  } finally {
    await client.close()
    await rm(temp, { recursive: true, force: true })
  }
})

test('csd mcp serves MCP over stdio as a spawned binary', async () => {
  const temp = await fixtureRepo('csd-mcp-stdio-')
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(REPO_ROOT, 'dist', 'cli.js'), 'mcp', '--root', temp],
  })
  const client = new Client({ name: 'stdio-test', version: '0.0.0' })
  try {
    await client.connect(transport)
    const tools = await client.listTools()
    assert.equal(tools.tools.length, 7)
    const report = (await client.callTool({ name: 'csd_inspect', arguments: {} })).structuredContent
    assert.equal(report.needsBootstrap, false)
    assert.equal(report.root, temp)
  } finally {
    await client.close()
    await rm(temp, { recursive: true, force: true })
  }
})

test('pinned stdio server refuses a different root from the client', async () => {
  const temp = await fixtureRepo('csd-mcp-pin-')
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(REPO_ROOT, 'dist', 'cli.js'), 'mcp', '--root', temp],
  })
  const client = new Client({ name: 'stdio-pin-test', version: '0.0.0' })
  try {
    await client.connect(transport)
    const result = await client.callTool({ name: 'csd_inspect', arguments: { root: '/elsewhere' } })
    assert.equal(JSON.parse(result.content[0].text).code, 'ROOT_MISMATCH')
  } finally {
    await client.close()
    await rm(temp, { recursive: true, force: true })
  }
})
