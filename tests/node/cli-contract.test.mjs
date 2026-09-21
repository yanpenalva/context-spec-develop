import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { bootstrap, inspect, install, remove } from '../../dist/installer.js'
import test from 'node:test'

test('project install writes the CSD skill, native command and lockfile', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'csd-install-'))
  try {
    await install({ scope: 'project', agents: ['claude-code'], root: temp, force: false })

    const skill = await readFile(join(temp, '.claude', 'skills', 'csd', 'SKILL.md'), 'utf8')
    const command = await readFile(join(temp, '.claude', 'commands', 'csd.md'), 'utf8')
    const lock = JSON.parse(await readFile(join(temp, '.agents', '.csd-lock.json'), 'utf8'))

    assert.match(skill, /name:\s*csd/)
    assert.match(command, /CSD bootstrap protocol/)
    assert.equal(lock.package, '@yanpenalva/context-spec-develop')
    assert.deepEqual(lock.agents, ['claude-code'])
    assert.ok(lock.files.length >= 2)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

test('install is idempotent and doctor detects external edits', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'csd-doctor-'))
  try {
    await install({ scope: 'project', agents: ['cursor'], root: temp, force: false })
    await install({ scope: 'project', agents: ['cursor'], root: temp, force: false })

    const commandPath = join(temp, '.cursor', 'commands', 'csd.md')
    await writeFile(commandPath, `${await readFile(commandPath, 'utf8')}\nchanged\n`)
    const doctor = await inspect('project', temp)
    assert.ok(doctor.problems.some((problem) => /modified/i.test(problem)))
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

test('all supported adapters produce the documented activation form', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'csd-adapters-'))
  try {
    await install({
      scope: 'project',
      agents: ['oas', 'codex', 'claude-code', 'cursor', 'copilot', 'gemini', 'opencode'],
      root: temp,
      force: false,
    })

    const expected = [
      ['.agents', 'skills', 'csd', 'SKILL.md'],
      ['.claude', 'commands', 'csd.md'],
      ['.cursor', 'commands', 'csd.md'],
      ['.github', 'agents', 'csd.md'],
      ['.gemini', 'commands', 'csd.toml'],
      ['.opencode', 'commands', 'csd.md'],
    ]
    for (const parts of expected) await stat(join(temp, ...parts))
    assert.match(await readFile(join(temp, '.gemini', 'commands', 'csd.toml'), 'utf8'), /prompt\s*=/)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

test('remove only deletes files owned by the lockfile', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'csd-remove-'))
  try {
    await install({ scope: 'project', agents: ['opencode'], root: temp, force: false })
    await remove('project', temp)
    await assert.rejects(stat(join(temp, '.opencode', 'commands', 'csd.md')))
    await assert.rejects(stat(join(temp, '.agents', '.csd-lock.json')))
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

test('bootstrap preserves existing AGENTS instructions and materializes canonical context', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'csd-bootstrap-'))
  try {
    await writeFile(join(temp, 'AGENTS.md'), '# Existing project rules\n\nKeep this text.\n')
    const report = await bootstrap(temp)
    assert.ok(report.created.includes('AGENTS.md (CSD integration)'))
    assert.match(await readFile(join(temp, 'AGENTS.md'), 'utf8'), /Keep this text/)
    assert.match(await readFile(join(temp, 'AGENTS.md'), 'utf8'), /CSD:BEGIN/)
    assert.match(await readFile(join(temp, '.context', 'INDEX.md'), 'utf8'), /Context Index/)
    await assert.rejects(stat(join(temp, '.context', 'work')))

    const second = await bootstrap(temp)
    assert.ok(second.skipped.includes('AGENTS.md'))
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

test('modified files block removal until force is explicit', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'csd-force-'))
  try {
    await install({ scope: 'project', agents: ['gemini'], root: temp, force: false })
    const commandPath = join(temp, '.gemini', 'commands', 'csd.toml')
    await writeFile(commandPath, 'user-owned = true\n')
    await assert.rejects(remove('project', temp), /modified files/)
    await remove('project', temp, true)
    await assert.rejects(stat(join(temp, '.agents', '.csd-lock.json')))
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

test('lockfile paths cannot escape the selected installation root', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'csd-traversal-'))
  try {
    await install({ scope: 'project', agents: ['codex'], root: temp, force: false })
    const lockPath = join(temp, '.agents', '.csd-lock.json')
    const lock = JSON.parse(await readFile(lockPath, 'utf8'))
    lock.files.push({ path: '../outside.txt', sha256: '0'.repeat(64) })
    await writeFile(lockPath, `${JSON.stringify(lock)}\n`)
    await assert.rejects(inspect('project', temp), /escapes installation root/)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

test('a collision is rejected before any adapter file is written', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'csd-atomic-'))
  try {
    await mkdir(join(temp, '.gemini', 'commands'), { recursive: true })
    await writeFile(join(temp, '.gemini', 'commands', 'csd.toml'), 'user-owned = true\n')
    await assert.rejects(
      install({ scope: 'project', agents: ['codex', 'gemini'], root: temp, force: false }),
      /Refusing to overwrite existing file/,
    )
    await assert.rejects(stat(join(temp, '.agents', 'skills', 'csd', 'SKILL.md')))
    await assert.rejects(stat(join(temp, '.agents', '.csd-lock.json')))
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

test('global adapters use host global command locations', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'csd-global-'))
  try {
    await install({ scope: 'global', agents: ['copilot', 'opencode'], root: temp, force: false })
    await stat(join(temp, '.copilot', 'agents', 'csd.md'))
    await stat(join(temp, '.config', 'opencode', 'commands', 'csd.md'))
    await stat(join(temp, '.config', 'opencode', 'skills', 'csd', 'SKILL.md'))
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})
