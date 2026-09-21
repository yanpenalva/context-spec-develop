# Context Budgets

Budgets are structural, semantic invariants — not token counts and not quotas. They bound how many detailed domains may be required and forbid blanket loading at any depth. The validator enforces the maxima and the manifest structure; it does not measure tokens.

The bootstrap is not counted against any budget: it is separate from context domains (see `README.md`) and always present.

## Minimal

- Mandatory bootstrap (separate from domains).
- A small context manifest — possibly empty when the task needs no domain context.
- Target evidence for the current decision.
- At most **3** required domains.
- No unrelated extended contracts; everything untriggered stays deferred.

## Standard

- Mandatory bootstrap.
- Relevant domain contracts for the accepted specification and plan, promoted as needed.
- Planning context and target evidence.
- At most **5** required domains.
- Additional domains only through explicit triggers (`triggers.md`).

## Extended

- Mandatory bootstrap.
- Broader discovery is *permitted*; it is never a blanket load.
- Relevant architecture, security, persistence and integration domains as required by evidence and triggers.
- At most **7** required domains.
- Still progressive: unrelated domains remain deferred even here.

The maxima stay 3/5/7 after the bootstrap split: they are ceilings, and the split already removed the fixed floor of three mandatory domains. A route does not need to fill its budget: an extended task may legitimately require only `core`, `security` and `architecture`. Unused context capacity is not an instruction to load more context.

## Invariants

1. `budget` equals the effective routing of the work item.
2. No domain is mandatory in every manifest. Governance still holds: the bootstrap carries the pre-classification boundaries, and `core` is the default promotion for governance-heavy work.
3. `required` and `deferred` are disjoint.
4. A domain that is not promoted by phase, trigger, classification signal or human request stays in `deferred` or unlisted — never silently required.
5. Domain names are exactly the catalog's names.
6. Mandatory policy behavior (for example evidence obligations) does not require mandatory full-document loading; the bootstrap carries the rule, the domain carries the detail.

## Token metrics readiness

These budgets make future measurement well-defined. Documented candidates for a later, optional implementation: bootstrap context size; context domains loaded; detailed contracts loaded; input/output tokens; handoff size; questions asked; subagents spawned; reclassifications; rework. The repository ships a reproducible benchmark (`benchmarks/`) that measures structural context size against a documented eager baseline. No tokenizer or vendor coupling exists, and no token-reduction percentage is claimed anywhere in this kit.
