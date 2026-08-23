# Review and Release Policy

- Every production-affecting change MUST have a review proportional to risk and independent of the implementation where practical.
- Review MUST compare the request, spec, plan, diff, tests, security impact and operational evidence.
- Review and validation MUST report findings without silently modifying implementation.
- Public interfaces, migrations, data transformations and configuration changes MUST include compatibility and rollback analysis.
- A release MUST name an approver, target, readiness evidence, smoke check, observation window and rollback trigger.
- Production authorization MUST remain with a human owner; an agent may prepare but not grant it.
- Post-release signals MUST be observed and the outcome recorded. Incidents and hotfixes MUST include a postmortem before closure.
- Git finalization MUST be separated from deployment authorization. An agent MUST present validation evidence and a proposed Conventional Commit message before asking for commit approval.
- Commit and push MUST have separate human approvals. A denied push leaves the approved local commit intact and MUST NOT trigger a retry or force push.
- Tags and destructive Git operations MUST require explicit approval; force push, hard reset and clean operations are prohibited by the core kit.
