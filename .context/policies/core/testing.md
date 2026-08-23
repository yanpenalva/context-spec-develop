# Testing Policy

- Every behavior change MUST have relevant verification evidence.
- Tests MUST cover the changed behavior, important boundaries, expected failures and regression risk.
- Security-sensitive changes MUST include authorization, validation, data exposure or abuse-path checks as applicable.
- Tests SHOULD be deterministic, isolated and named after observable behavior.
- Test doubles MUST preserve the contract they represent; use real integration boundaries when mocking would hide the risk.
- A test command MAY be project-specific, but the exact command and result MUST be recorded.
- No person or agent may claim tests passed without running them.
- Coverage is a signal. Projects MUST define a meaningful changed-code threshold or record an approved exception; global coverage alone is insufficient.
- Known flaky, skipped or environment-dependent tests MUST be visible in verification and owned for follow-up.
