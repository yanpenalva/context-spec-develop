# Verification: FEAT-9003

## Evidence

Commands at closure, repository root:

- `python3 scripts/validate_context.py --strict --examples` → `Context validation passed.`, exit 0.
- `python3 -m unittest discover -s tests` → `Ran 48 tests ... OK`.

## Acceptance criteria check

1. Four context-routing contracts exist and are linked (validator required files; INDEX read-first and map). Pass.
2. Validator enforces every spec invariant deterministically: derivation consistency; upgrade-only overrides with human authority and reason; manifest structure, catalog-parsed names, disjointness, mandatory core, budget equals effective routing, budget maxima; handoff-domain column; decision-category and execution-state constants. Pass (dedicated tests assert each rejection message).
3. All 30 prior tests pass unmodified; 18 new tests pass. Pass.
4. End-to-end example covers bootstrap, immediate classification, manifest, DISCOVERABLE→CONTINUE, HUMAN_DECISION_REQUIRED→WAITING_FOR_HUMAN, trigger expansion, reclassification, human override, compact handoffs. Pass.
5. `AGENTS.md` grew by one clause; `.context/` remains canonical. Pass.
6. No token-percentage claims; only structural-guarantee wording. Pass (grep for "token" finds metrics-readiness and wording guards).

## Regressions

None. Legacy-shape items (`classification.routing` without root routing) validate; dual-shape items fail with a precise error; all pre-existing tests unchanged.

## Correctness notes

- The validator derives the valid domain set from `catalog.md` itself, so the catalog stays the single source; a renamed domain invalidates manifests referencing the old name (tested).
- Budget maxima are enforced on the required set; deferred domains are unbounded by design.

## Limitations

- The validator cannot judge whether a trigger "should" have fired; triggers are auditable but not semantically enforced — by design.
- Same-session review; see `review.md`.
