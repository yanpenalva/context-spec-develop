# Enterprise Adoption Guide

## Why this exists

AI-assisted development increases the speed of drafting and implementation, but informal requests, scattered context and unverifiable claims increase delivery and operational risk. This kit creates one auditable path from intent to verified production change while allowing each project to keep its own stack and commands.

## Operating model

The central repository owns the core policies, workflows, schemas, prompts and validator. Each project owns its project context, conversation profiles, enabled stack profiles, quality commands, thresholds, exceptions and work items. Projects consume a tagged snapshot and update it through a reviewed pull request.

The kit does not replace product ownership, architecture governance, security review, incident management, deployment tooling or deployment authorization. It makes their evidence explicit and puts the decision at a known gate.

## Governance and ownership

| Concern | Central kit | Adopting project |
| --- | --- | --- |
| Core policies and schema | Maintains and versions | Consumes and may strengthen |
| Stack profile | Publishes optional profile later | Enables and configures |
| Architecture and stack facts | Provides placeholders | Owns and keeps current |
| Quality commands and thresholds | Provides references | Defines and operates |
| Exception policy | Defines contract | Approves, expires and reviews |
| Production change | Provides evidence format | Authorizes and executes |

## RACI starter matrix

The adopting organization assigns named people or groups for each work item. An agent can assist with drafting and checks, but is never the accountable or approving party.

| Activity | Responsible | Accountable | Consulted | Informed |
| --- | --- | --- | --- | --- |
| Product discovery and acceptance | Product owner | Product owner | Users, engineering, security | Support and delivery |
| Support triage and containment | Support lead or incident commander | Service owner | Engineering, security, communications | Stakeholders and users |
| Specification and plan | Implementing engineer | Work-item owner | Product/support, architecture, security | Reviewer |
| Preflight and code review | Reviewer(s) | Engineering owner | Security, operations, product/support | Work-item owner |
| Release and deployment | Delivery/operator | Release approver | Engineering, operations, support | Stakeholders |
| Observation and closure | Work-item owner and operator | Service owner | Product/support, security | Contributors |
| Policy exception | Exception owner | Named approver | Security, engineering governance | Affected owners |

## Maturity model

### Starter

Project context and Product/Support workflow are present. Work items contain intent and basic evidence. Structural validation runs locally.

### Managed

Core policies, ownership, quality commands, review gates and CI validation are configured. Exceptions are versioned and expiring.

### Enterprise

Security, privacy, AI governance, release observability, quality thresholds, exception review, version updates and outcome metrics are configured. The enterprise validator mode is required for release.

## Recommended rollout

Use a six-week pilot:

1. Week 1: select sponsors, configure one Product and one Support team, train roles and complete project context.
2. Weeks 2–5: run at least one feature and one support item, recording friction and exceptions rather than bypassing gates silently.
3. Week 6: review evidence, developer experience, quality regressions, delivery trends and proposed policy changes.

Promote the kit when the pilot demonstrates that teams can create, review and close work items without external oral context and that the controls do not create unowned queues.

## Measurement

Measure adoption and outcomes, not individual output:

- repositories and teams by kit version and governance mode;
- work items passing required gates;
- active and expired exceptions;
- new critical issues, escaped defects, changed-code coverage, duplication and complexity regressions;
- change lead time, deployment frequency, failed deployment recovery time, change fail rate and deployment rework rate;
- human review coverage for AI-assisted changes and AI-related security incidents;
- developer and operator experience through periodic qualitative feedback.

Do not use token counts, generated lines, prompt counts or rankings as productivity targets.

## Enterprise controls

Before enabling enterprise mode, configure data classification, approved agents, permissions, retention, security reporting, quality commands, observation signals and owners. High-risk or sensitive work must reference an approved exception when a baseline control is not yet feasible.

## Failure modes to watch

- copying the full context into every prompt until it becomes stale;
- treating an agent's confidence as evidence;
- making `else` or a metric a dogmatic proxy for good design;
- measuring compliance without improving flow;
- comparing teams with different systems and constraints;
- allowing exceptions to expire silently;
- treating a template copy as permanently current.
