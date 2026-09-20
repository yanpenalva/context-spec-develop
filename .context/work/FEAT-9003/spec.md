# Specification: Immediate classification, context routing and progressive disclosure

## Objective

Classify as early as possible on a minimal bootstrap and use that classification to load only the minimum sufficient canonical context per decision and phase — with structural guarantees, not token claims. Separate decision category from execution state and derived routing from effective routing.

## In scope

- New canonical layer `.context/context-routing/` (README, catalog, budgets, triggers).
- Work-item schema: optional root `routing` object (`derived`, `effective`, optional `override`), optional `context` object (`budget`, `required`, `deferred`, `triggers`); `classification.routing` becomes a deprecated legacy field.
- Interaction protocol: decision categories reduced to five authority categories; `BLOCKED` becomes an execution state (`CONTINUE`, `WAITING_FOR_HUMAN`, `BLOCKED`); explicit precedence replaces the subjective rule.
- Validator: catalog-parsed domain set, routing and override checks, manifest checks, subtask-table context-domain column, decision-state mapping constants.
- Compact handoff contract mapped onto existing artifacts (subtask table gains an optional context-domains column).
- End-to-end worked example under `docs/examples/`; documentation and example migration.

## Out of scope

- Tokenizers, token metrics instrumentation, telemetry, dashboards, billing.
- Any classifier engine (LLM or external); vendor or model coupling; RAG, embeddings, caches.
- New orchestration engine; automatic LLM summarization.
- Removing or weakening any gate, policy MUST, or human approval boundary.

## Evidence

- Repository state at commit `1f123b6` (FEAT-9001, FEAT-9002 baseline).
- Gaps recorded in `discovery.md`.

## Rules and contracts

- Normative efficiency principle: context inclusion requires purpose; exclusion is the default. A context domain loads only for a classification signal, a workflow phase requirement, runtime evidence, an explicit human request, or a mandatory governance/safety requirement.
- Immediate classification: minimal bootstrap (AGENTS.md → INDEX essentials → classification and interaction core → context catalog) precedes detailed project context.
- `derived routing` comes only from `derive_routing`; `effective routing` differs only through a recorded upward override (authority `human`, reason required). Downgrades happen only through legitimate reclassification.
- Decision categories: `DISCOVERABLE`, `REVERSIBLE_AGENT_DECISION`, `ASSUMPTION_ALLOWED`, `HUMAN_DECISION_REQUIRED`, `CRITICAL_HUMAN_GATE`. Execution states: `CONTINUE`, `WAITING_FOR_HUMAN`, `BLOCKED`. `BLOCKED` means no safe path exists now — never merely "a question is pending".
- Precedence: protected boundaries outrank autonomous decisions; when aspects span categories, the highest-authority applicable category wins; execution state follows deterministically from the category plus path-safety.
- Context manifest: `budget` equals `effective routing`; `core` is always required; required and deferred are disjoint; domain names come from `catalog.md`; per-budget required-domain maxima (minimal 3, standard 5, extended 7) are structural, semantic invariants — not token counts.
- `extended` permits broader discovery, never blanket loading.
- Compact handoffs persist decisions, evidence, constraints, outputs and acceptance criteria — never conversation history or private reasoning. The existing subtask table is the planner→executor handoff; `verification.md` is the executor→reviewer evidence handoff.
- Guarantees are structural; no token-percentage claims anywhere.

## Security impact

None. No security boundary changes; the security domain trigger strengthens context availability when the signal rises.

## Tests

Decision-state mapping (continue/waiting/blocked separation, category set), routing (derived variants, effective equality, three upgrade pairs, downgrade rejection, missing reason, invalid authority, dual-shape conflict), context routing (valid manifest, unknown domain, required/deferred conflict, core mandatory, budget/effective mismatch, budget maximum, catalog consistency, minimal regression: low/local/none never requires security, incident, release, architecture domains), handoff column (valid and invalid domains), compatibility (legacy `classification.routing` items and all existing examples remain valid).

## Acceptance criteria

1. All four context-routing contracts exist and are linked from `INDEX.md` and the validator.
2. Validator enforces every invariant in `Rules and contracts` deterministically.
3. All prior tests pass unmodified; new tests pass.
4. End-to-end example covers immediate classification, manifest, no-unnecessary-question, human decision, context expansion, reclassification, override and compact handoffs.
5. `AGENTS.md` grows by at most one clause; `.context/` remains canonical.
6. No token-percentage claims appear anywhere.
