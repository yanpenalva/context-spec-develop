# Review and Release Policy

- Every production-affecting change MUST have a review proportional to risk and independent of the implementation where practical.
- Review MUST compare the request, spec, plan, diff, tests, security impact and operational evidence.
- Review and validation MUST report findings without silently modifying implementation.
- Public interfaces, migrations, data transformations and configuration changes MUST include compatibility and rollback analysis.
- A release MUST name an approver, target, readiness evidence, smoke check, observation window and rollback trigger.
- Production authorization MUST remain with a human owner; an agent may prepare but not grant it.
- Post-release signals MUST be observed and the outcome recorded. Incidents and hotfixes MUST include a postmortem before closure.
- Git finalization MUST be separated from deployment authorization. An agent MUST present validation evidence and a proposed Conventional Commit message before finalizing.
- The default `confirm_each` mode requires separate human approvals for commit and push. The user may state an `automatic` preference at any point, including the start of the conversation; otherwise the mode is resolved before Git finalization becomes necessary. A resolved `automatic` choice authorizes only a validated commit and push for the recorded work item, branch and remote.
- A denied push in `confirm_each` mode leaves the approved local commit intact and MUST NOT trigger a retry or force push. Any scope, branch, remote or risk change invalidates automatic authorization.
- Tags and destructive Git operations MUST require explicit approval; force push, hard reset and clean operations are prohibited by the core kit.
- A project MAY configure automated pull-request opening. The configured command MUST only open pull requests; merging, force and administrative overrides MUST remain human decisions. Opening a pull request never approves it.
