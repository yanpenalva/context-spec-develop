# Security Context

## Controls

- Authentication: `NOT FOUND` (the CLI/MCP server operates on local repository files; no application authentication system is documented).
- Authorization: MCP writes are restricted to an artifact allowlist under `.context/work/<id>/`.
- Input validation: CLI option validation, MCP schemas and work-item validation, path containment, and artifact allowlists are present in `src/`.
- Secrets management: `NOT FOUND`
- Sensitive data handling: `SECURITY.md` instructs contributors not to publish credentials, personal data or active incident details.
- Audit and logging: `NOT FOUND`
- Vulnerability reporting channel: A private security channel is required by `SECURITY.md`; its address and owner are `NOT FOUND`.

Every work item must state relevant security impact. Never copy secrets, personal data or exploit details into versioned artifacts.

The normative minimum is in `.context/policies/core/security-privacy.md`. Add project-specific controls, owners and reporting channels here.
