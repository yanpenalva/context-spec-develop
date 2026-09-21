import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = fileURLToPath(new URL('../..', import.meta.url))

test('registry records the exact packaged skill hash and catalog version', async () => {
  const registry = JSON.parse(await readFile(join(root, 'registry', 'skills.json'), 'utf8'))
  const skill = await readFile(join(root, 'skill', 'csd', 'SKILL.md'))
  const entry = registry.skills.find((candidate) => candidate.name === 'csd')
  assert.ok(entry)
  assert.deepEqual(registry.compatibility.nativeSlashCommand, ['claude-code', 'cursor', 'gemini', 'opencode'])
  assert.deepEqual(registry.compatibility.explicitSkill, ['oas', 'codex'])
  assert.deepEqual(registry.compatibility.customAgent, ['copilot'])
  assert.equal(entry.version, '0.3.0')
  assert.deepEqual(entry.files, [{
    path: 'SKILL.md',
    sha256: createHash('sha256').update(skill).digest('hex'),
    bytes: skill.byteLength,
  }])

  const catalog = await readFile(join(root, 'catalog', 'index.html'), 'utf8')
  assert.match(catalog, /Version <code>0\.3\.0<\/code>/)
  assert.match(catalog, /@yanpenalva\/context-spec-develop install/)
})
