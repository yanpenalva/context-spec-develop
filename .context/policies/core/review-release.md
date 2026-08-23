# Review and Release Policy

- Every production-affecting change MUST have a review proportional to risk and independent of the implementation where practical.
- Review MUST compare the request, spec, plan, diff, tests, security impact and operational evidence.
- Review and validation MUST report findings without silently modifying implementation.
- Public interfaces, migrations, data transformations and configuration changes MUST include compatibility and rollback analysis.
- A release MUST name an approver, target, readiness evidence, smoke check, observation window and rollback trigger.
- Production authorization MUST remain with a human owner; an agent may prepare but not grant it.
- Post-release signals MUST be observed and the outcome recorded. Incidents and hotfixes MUST include a postmortem before closure.
