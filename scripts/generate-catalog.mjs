import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const registry = JSON.parse(await readFile(join(root, 'registry', 'skills.json'), 'utf8'))
const skill = registry.skills[0]
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CSD skills</title><style>body{font:16px system-ui;max-width:860px;margin:4rem auto;padding:0 1rem;color:#202124}code{background:#f1f3f4;padding:.15rem .3rem;border-radius:4px}pre{background:#f8f9fa;padding:1rem;overflow:auto}</style></head>
<body><h1>Context Spec Develop</h1><p>Installable, agent-neutral delivery workflow for AI coding agents.</p><h2>${skill.name}</h2><p>${skill.description}</p><p>Version <code>${skill.version}</code> · ${skill.license}</p><pre>npx @yanpenalva/context-spec-develop install</pre><h3>Activation</h3><ul><li>Claude Code, Cursor, Gemini and OpenCode: <code>/csd</code></li><li>Codex: <code>$csd</code></li><li>Copilot: select the <code>csd</code> agent</li></ul><p>Files: ${skill.files.length}. Registry hashes are generated during release.</p></body></html>
`
const destination = join(root, 'catalog', 'index.html')
await mkdir(dirname(destination), { recursive: true })
await writeFile(destination, html)
