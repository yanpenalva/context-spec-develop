# Prompt Contract: Initialize Project

Canonical contract for **project onboarding**: initializing the project-specific canonical context of an adopting repository. It covers only initialization; general workflow, classification, routing and orchestration live in their own layers.

## Lifecycle

The kit has two conceptual lifecycle modes. They are a documentation distinction, not a persisted state:

```text
PROJECT ONBOARDING  = initialize the reusable canonical project context (this contract; runs once, re-runnable)
DAILY WORK          = every operational request (AGENTS.md → bootstrap → classification → routing → context routing → workflow)
```

Onboarding is not a task and creates **no work item**: it is not a Product feature, Support bug, incident or hotfix, and it must not contaminate work classification. Onboarding discovery is also not task discovery:

```text
TASK DISCOVERY              = minimal evidence needed to classify one request
PROJECT ONBOARDING DISCOVERY = bounded repository-wide discovery needed to initialize
                               reusable canonical project context
```

Onboarding may inspect more broadly than a task would, but it stays fact-oriented: it never reads every file and never dumps the repository into context.

## When to run

Run this contract when the project context is not yet initialized — canonical files under `.context/project/` are predominantly placeholders or `NOT FOUND`, or `.context/config.json` still carries `NOT FOUND` quality fields — or when the user asks to initialize the project context in plain language. There is no required magic phrase; any intent to initialize qualifies.

## Flow

```text
                     INSTALL KIT
                          │
                          ▼
                  PROJECT ONBOARDING
                          ▼
                REPOSITORY DISCOVERY
                          │
              ┌───────────┴───────────┐
              │                       │
        DISCOVERABLE              UNKNOWN
              │                       │
              ▼                       ▼
      populate canonical       interaction policy
           context                    │
                                      ▼
                               ask only if material
              │                       │
              └───────────┬───────────┘
                          ▼
                       VALIDATE
                          │
                          ▼
                         READY
```

## 1. Check the current state first (idempotency)

If project context is already populated with confirmed facts, this is a refresh, not a blank initialization:

```text
existing confirmed fact            → preserve
discoverable stale fact            → propose/update with evidence
NOT FOUND, now discoverable        → populate
conflicting evidence               → report the conflict with both sources
human-owned organizational fact    → do not overwrite automatically
```

No complex merge is required: report what would change and let the human confirm material updates.

## 2. Bounded repository discovery

Attempt to discover, from repository evidence only, the facts these canonical files record:

```text
languages, frameworks, package managers, repository structure,
application entry points, test frameworks, test commands,
lint commands, static-analysis commands, build commands,
known deployment/config files, persistence technology,
major modules, public interfaces, CI configuration,
documented architecture, repository conventions
```

Populate the existing canonical contracts — `.context/project/overview.md`, `stack.md`, `architecture.md`, `conventions.md`, `testing.md`, `quality.md` (commands and thresholds that are discoverable), `security.md` (controls that exist in the repository, e.g. a `SECURITY.md`), `.context/config.json` (`project.name`, `project.repository`, discoverable `quality` commands) — and the delivery/observability/ai-governance files where the repository actually evidences them. Never create a parallel onboarding database; the canonical files are the only destination.

After bounded discovery, inspect only the configured module-context roots. The default roots are `.context/project/modules/`, `.context/project/domains/`, `.context/project/bounded-contexts/`, `.context/modules/`, `.context/domains/`, `.ai/modules/`, `.ai/domains/`, and `.ai/bounded-contexts/`; projects may narrow or replace them in `csd.config.json`. If module documentation or an index exists, report its paths and preserve it. If no structure exists and module-context discovery is enabled, ask once whether to create the generic framework-neutral scaffold. Apply the scaffold only after explicit approval; if declined, persist the decline in the selected context layout and do not ask again. This step documents domains, not architecture: never invent module boundaries, create module-specific files or copy a compatibility layout.

Anything not found is recorded as `NOT FOUND`. Never invent a fact, owner, command, threshold or procedure.

## 3. Organizational facts are never inferred

Repository evidence may discover the language and version, the framework, the persistence engine, the test runner and the CI system. It MUST NOT invent:

```text
production approver, security owner, SLA,
business criticality, release authority, compliance requirements,
risk ownership, organizational policy not represented in the repository
```

Leave them `NOT FOUND`, or ask — but only when the unknown is material to configuration, governance or workflow, and only after discovery failed.

## 4. Ask only non-discoverable material questions

Apply `.context/interaction/README.md` unchanged: inspect before ask, decision-changing questions only, critical human gates stay human. Before asking any question:

```text
DISCOVERABLE? → inspect, do not ask
NOT discoverable AND material to configuration/governance/workflow → ask
NOT discoverable AND not material → record NOT FOUND, move on
```

Typical legitimate questions: production owner, release authority, business-critical boundaries, undocumented deployment procedures, risk ownership, organizational policy absent from the repo. None of these questions is mandatory by default; skip every one the project does not need.

Onboarding never weakens human authority: scope approval, risk acceptance, production authorization, security/policy exceptions, incident closure and release authority remain human decisions and are never inferred from repository metadata.

## 5. Validate and report

Run `python3 scripts/validate_context.py --strict --examples` and report:

- populated facts, each with its evidence source;
- `NOT FOUND` items left open;
- conflicts found and how they were resolved;
- material questions still waiting on a human, each mapped to a decision category per `.context/interaction/decision-policy.md`.

When validation passes and no blocking material question remains, the project is READY: daily work then enters through the front door — bootstrap, classification, deterministic routing, context routing — per `AGENTS.md`, `.context/classification/README.md` and `.context/context-routing/README.md`.
