# Specification: FEAT-9010

## Objective

Make startup interaction demand-driven. The canonical order becomes: bootstrap → classification → routing → context routing → interaction evaluation. Profile, Git mode and role overrides resolve lazily, just-in-time.

## Scope

### Resolution semantics (canonical)

```text
conversation_profile:
  explicit user choice        → reuse
  recorded preference (harness/project/config) → reuse
  configured default          → apply, state briefly
  no default satisfies AND material difference → ask
PROFILE != CLASSIFICATION != ROUTING != AUTHORIZATION
Profile is never derived mechanically from routing.

git_finalization_mode:
  explicit user statement     → reuse
  unresolved                  → DEFERRED DECISION != GRANTED AUTHORIZATION
  becomes relevant            → resolve before the first Git action
  safe fallback when needed   → confirm_each
  absence never means automatic.

agent-role overrides:
  defaults from orchestration config; ask only on explicit request,
  invalid/missing assignment, or materially different need.
```

### Files (ordering/protocol)

`AGENTS.md`, `prompts/start-conversation.md`, `prompts/intake.md`, `prompts/close.md`, `profiles/README.md`, `profiles/delivery-orchestrator.md`, `workflows/core.md`, `.context/INDEX.md`, `orchestration/README.md`, `classification/README.md` (front-door ordering invariant), `interaction/README.md` (questions are a cost too + priority order), glossary, `README.md`, `docs/getting-started.md`, `docs/quickstart.pt-BR.md`, `docs/agent-orchestration.md`.

### Out of scope / untouched

No schema change (`conversation_profile` stays required-and-resolvable-by-default; `git_finalization_mode` stays optional). No validator structural change; no config.json change; classifier architecture, routing derivation, triggers, budgets, golden dataset untouched; no new `.context/` files; no provider/model work. Historical FEAT artifacts untouched.

## Acceptance criteria

1. No canonical instruction tells the agent to ask profile/Git mode before classification; explicit preferences are reused.
2. Front-door ordering invariant present at SHOULD strength (allows decisions required to classify safely).
3. Git: unresolved mode valid before Git actions, never authorizes automatic; `confirm_each` fallback; all existing Git protections intact.
4. Onboarding unchanged and profile-free unless material.
5. Validator `--strict --examples` exit 0; suite green including new focused tests; both benchmarks green.
6. Happy-path docs show describe-work → work; early profile/Git choice remains documented as explicit override only.
