# Core Delivery Workflow

This is the shared lifecycle for every change that can affect users, data or production.

```text
Intake → Specify → Plan → Preflight Validate → Execute and Test
       → Verify and Review → Release and Deploy → Observe and Close
```

## Start every conversation

Read `AGENTS.md`, select one conversation profile, then run intake. Product means new user or business value. Support means a reproducible bug, active incident or urgent hotfix. Record the selected profile, `track` and `type` in `work-item.json` before implementation.

Before Execute and Test, split the approved plan into small subtasks. Organize them into waves ordered by dependencies. Parallel subagents receive bounded scope, relevant context and a stop condition; a parent owner integrates their evidence.

## Gates

### Intake

Classify the work, owner, affected users, risk, dependencies and desired outcome. Do not start implementation from an unclassified request.

### Specify

Record objective, scope, out of scope, evidence, rules, contracts, security impact and acceptance criteria. Unknowns are explicit.

### Plan

Choose the smallest viable approach. List files or components only when confirmed, data and API changes, tests, migration strategy, rollback and operational risks.

### Preflight Validate

An independent person or agent checks that the request, spec and plan agree, that the context is sufficient, and that the proposed change is authorized. This gate does not edit code.

### Execute and Test

Implement only the approved plan. Keep a local progress log, preserve contracts, and record exact test commands and results.

### Verify and Review

Compare the request, spec, plan, diff, security implications and test evidence. Findings return to execution with an explicit correction scope.

### Release and Deploy

Confirm readiness, approvals, migration/data safety, rollback, communication, feature flags and observability before production change.

### Observe and Close

Run smoke checks, monitor declared signals, execute rollback or escalation when thresholds fail, and record outcome, residual risk and learning.

Humans retain approval for scope, risk acceptance, production authorization and closure even when an agent prepares the artifacts.
