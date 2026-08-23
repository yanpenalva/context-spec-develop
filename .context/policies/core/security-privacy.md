# Security and Privacy Policy

- Untrusted input MUST be validated at the boundary and authorized for the requested operation.
- Authentication and authorization MUST be enforced by deterministic application controls, not by agent instructions or UI state.
- Secrets, credentials, tokens and personal data MUST NOT appear in prompts, source, fixtures, logs or public artifacts.
- Logs MUST support diagnosis without exposing sensitive values; clients MUST not receive stack traces or internal secrets.
- Database and shell interactions MUST use safe parameterization and least privilege.
- Dependencies, generated code and build inputs SHOULD be checked for vulnerabilities, licensing and supply-chain risk.
- Data collection, retention, masking, deletion and residency MUST follow the project's classification and legal obligations.
- A suspected vulnerability MUST use the private reporting process in `SECURITY.md`.
