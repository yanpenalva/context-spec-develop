import { cp, mkdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const destination = join(root, 'assets', 'template')
await rm(destination, { recursive: true, force: true })
await mkdir(destination, { recursive: true })
await cp(join(root, '.context'), join(destination, '.context'), {
  recursive: true,
  filter(source) {
    const relative = source.slice(join(root, '.context').length)
    return !relative.startsWith('/work') && !relative.includes('/__pycache__')
  },
})
await cp(join(root, 'AGENTS.md'), join(destination, 'AGENTS.md'))
