# Specification: Project Onboarding and Intrinsic Classification Front Door

## Objective

Make the kit's two structural properties explicit and operational:

1. **Project onboarding** — installing the kit into an existing project becomes agent-assisted: bounded repository discovery populates the canonical project context; the human answers only non-discoverable material questions.
2. **Intrinsic front door** — classification, deterministic routing and context routing are mandatory protocol stages for every operational request, not an optional feature the agent decides to call. Who executes the classifier remains a harness choice.

## Scope

### In scope

- One new canonical onboarding contract: `.context/prompts/initialize-project.md` (chosen over `.context/project/onboarding.md` because `prompts/` owns agent-facing procedures and `project/` owns adopted-project facts — SRP).
- Lifecycle distinction PROJECT ONBOARDING vs DAILY WORK, documented only — no enum, no persisted state, no schema change.
- Front-door invariant language in `.context/classification/README.md`, `classifier-contract.md`, `.context/context-routing/README.md`, `AGENTS.md`, `README.md`, docs.
- Strong context invariant at SHOULD strength: detailed canonical context is not loaded before initial classification unless required to classify safely — targeted discovery stays available.
- Onboarding discovery formally distinct from task discovery; bounded, fact-oriented, never a full repository dump.
- Idempotency expectations for re-running onboarding (documented; no complex merge).
- Validator: add the onboarding contract to `REQUIRED_FILES` (deterministic existence check only; no prose parsing).
- Focused machine-checkable tests; benchmark relationship documentation.

### Out of scope

- No classifier/model/provider implementation or naming; no new `.context/` layer directories.
- No schema fields; no migration for existing adopters.
- Onboarding does not create a Product/Support work item — it initializes framework context, it is not Product/Support semantics.
- No token-percentage claims; no benchmark result fabrication.

## Rules and contracts

- Onboarding reuses `.context/interaction/` (inspect before ask; decision-changing questions only) and records organizational unknowns as `NOT FOUND` — never inferred (production approver, security owner, SLA, release authority, compliance).
- Discoverable facts populate the existing canonical files (`.context/project/*`, `config.json` quality fields); no parallel onboarding database.
- Daily zero-config use: after initialization, the user describes outcomes in plain language; the harness following `AGENTS.md` runs bootstrap → classification → routing → context routing → workflow. No incantation required, and the kit cannot guarantee that harnesses which do not follow `AGENTS.md` obey the protocol (documented boundary).
- Structural context economy: decide what context is needed before loading detailed context. The kit controls canonical context loading; it does not control harness system prompts, tool schemas, IDE-injected context, provider memory or connector context.

## Acceptance criteria

1. `.context/prompts/initialize-project.md` exists, is referenced from `AGENTS.md`, `.context/INDEX.md` and `start-conversation.md`, and links pass `check_links`.
2. Front-door invariants stated in canonical classification and context-routing contracts; no `use_classifier` decision exists in the canonical contract; same-agent remains the zero-config default.
3. `docs/getting-started.md` and `docs/quickstart.pt-BR.md` show the initialize-once → work-normally flow without a mandatory mega-prompt and without exact-phrase dependence.
4. Validator passes `--strict --examples` with the new required file; unit tests pass; both benchmarks still run and remain provider-neutral.
5. No vendor/model name in the touched canonical contracts; no new schema fields (`work-item.schema.json` unchanged).
6. Existing work items and populated project contexts remain valid (idempotent onboarding recognizes initialized state).
