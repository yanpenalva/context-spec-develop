import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, realpath, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'

export async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

export async function sha256(content: string | Buffer): Promise<string> {
  return createHash('sha256').update(content).digest('hex')
}

export function isInside(root: string, candidate: string): boolean {
  const base = resolve(root)
  const target = resolve(candidate)
  return target === base || target.startsWith(`${base}${sep}`)
}

/** Raised when a resolved path (including symlink targets) leaves its root. */
export class PathEscapeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PathEscapeError'
  }
}

/**
 * Resolve `path` through the filesystem (following symlinks) and guarantee the
 * resolved target stays inside `root`. Returns the real absolute path or throws.
 */
export async function realInside(root: string, path: string): Promise<string> {
  const base = await realpath(resolve(root))
  const target = resolve(base, path)
  if (!isInside(base, target)) throw new PathEscapeError(`Path escapes repository root: ${path}`)
  let real: string
  try {
    real = await realpath(target)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Missing leaf: verify every existing ancestor instead, so a symlinked
      // directory in the chain cannot smuggle a write outside the root.
      let current = dirname(target)
      while (!await exists(current)) current = dirname(current)
      real = join(await realpath(current), relativeFrom(current, target))
    } else {
      throw error
    }
  }
  if (!isInside(base, real)) throw new PathEscapeError(`Path escapes repository root: ${path}`)
  return real
}

function relativeFrom(from: string, to: string): string {
  const fromParts = resolve(from).split(sep).filter(Boolean)
  const toParts = resolve(to).split(sep).filter(Boolean)
  let shared = 0
  while (shared < fromParts.length && shared < toParts.length && fromParts[shared] === toParts[shared]) shared += 1
  return toParts.slice(shared).join(sep)
}

export async function atomicWrite(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`
  try {
    await writeFile(temporary, content, 'utf8')
    await rename(temporary, path)
  } finally {
    await rm(temporary, { force: true })
  }
}

/** Atomic write whose destination is verified to resolve inside `root`. */
export async function atomicWriteInside(root: string, path: string, content: string): Promise<string> {
  const target = await realInside(root, path)
  if (!isInside(await realpath(resolve(root)), target)) throw new Error(`Path escapes repository root: ${path}`)
  await atomicWrite(target, content)
  return target
}

/** Read whose source is verified to resolve inside `root`. */
export async function readInside(root: string, path: string): Promise<string> {
  return readFile(await realInside(root, path), 'utf8')
}

export async function readJson<T>(path: string): Promise<T | undefined> {
  if (!(await exists(path))) return undefined
  return JSON.parse(await readFile(path, 'utf8')) as T
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await atomicWrite(path, `${JSON.stringify(value, null, 2)}\n`)
}

export async function listFiles(root: string): Promise<string[]> {
  if (!(await exists(root))) return []
  const result: string[] = []
  async function visit(current: string): Promise<void> {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      if (entry.isDirectory()) await visit(path)
      else if (entry.isFile()) result.push(path)
    }
  }
  await visit(root)
  return result.sort()
}

export function absoluteRoot(root: string | undefined, fallback: string): string {
  return resolve(root ?? fallback)
}
