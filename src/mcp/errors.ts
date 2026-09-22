/** Structured, serializable error surfaced through MCP tool results. */
export class CsdToolError extends Error {
  readonly code: string
  readonly details: Record<string, unknown> | undefined

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'CsdToolError'
    this.code = code
    this.details = details
  }

  toJSON(): { code: string; message: string; details?: Record<string, unknown> } {
    const payload: { code: string; message: string; details?: Record<string, unknown> } = {
      code: this.code,
      message: this.message,
    }
    if (this.details !== undefined) payload.details = this.details
    return payload
  }
}

export const Codes = {
  RepositoryNotFound: 'REPOSITORY_NOT_FOUND',
  NotACsdRepository: 'NOT_A_CSD_REPOSITORY',
  RootRequired: 'ROOT_REQUIRED',
  RootMismatch: 'ROOT_MISMATCH',
  PathEscape: 'PATH_ESCAPE',
  WorkItemNotFound: 'WORK_ITEM_NOT_FOUND',
  WorkItemInvalid: 'WORK_ITEM_INVALID',
  ArtifactNotAllowed: 'ARTIFACT_NOT_ALLOWED',
  ContentInvalid: 'CONTENT_INVALID',
  BootstrapGate: 'BOOTSTRAP_GATE',
  ValidationNotRun: 'VALIDATION_NOT_RUN',
  ValidationError: 'VALIDATION_FAILED',
} as const

export type Code = (typeof Codes)[keyof typeof Codes]

export function repositoryNotFound(root: string): CsdToolError {
  return new CsdToolError(Codes.RepositoryNotFound, `Repository root does not exist or is not a directory: ${root}`)
}
