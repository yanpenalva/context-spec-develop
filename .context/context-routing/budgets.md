# Context Budgets

Budgets are structural, semantic invariants — not token counts. They bound how many detailed domains may be required and forbid blanket loading at any depth. The validator enforces the maxima and the manifest structure; it does not measure tokens.

## Minimal

- Mandatory bootstrap (AGENTS.md, INDEX essentials, classification and interaction core, this catalog).
- A small context manifest.
- Target evidence for the current decision.
- At most **3** required domains (including mandatory `core` and `project`).
- No unrelated extended contracts; everything untriggered stays deferred.

## Standard

- Mandatory bootstrap.
- Relevant domain contracts for the accepted specification and plan.
- Planning context and target evidence.
- At most **5** required domains.
- Additional domains only through explicit triggers (`triggers.md`).

## Extended

- Mandatory bootstrap.
- Broader discovery is *permitted*; it is never a blanket load.
- Relevant architecture, security, persistence and integration domains as required by evidence and triggers.
- At most **7** required domains.
- Still progressive: unrelated domains remain deferred even here.

## Invariants

1. `budget` equals the effective routing of the work item.
2. `core` is in `required` for every manifest; `project` and `testing` are mandatory by default per `catalog.md`.
3. `required` and `deferred` are disjoint.
4. A domain that is not mandatory, phase-required, triggered, or human-requested stays in `deferred` or unlisted — never silently required.
5. Domain names are exactly the catalog's names.

## Token metrics readiness

These budgets make future measurement well-defined. Documented candidates for a later, optional implementation: bootstrap context size; context domains loaded; detailed contracts loaded; input/output tokens; handoff size; questions asked; subagents spawned; reclassifications; rework. No tokenizer or vendor coupling exists today, and no token-reduction percentage is claimed anywhere in this kit.
