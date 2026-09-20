# Plan: Declarative classification layer and human interaction protocol

Routing is `extended` (cross-module impact on the kit's own contract surface): dependency analysis below, waves, and independent review before closure.

## Approach

Add two canonical contract directories, wire them into intake/preflight/start-conversation and `INDEX.md`, extend the work-item schema and validator with optional `classification` and `reclassification` support, update templates, demonstrate six classification/interaction cases in the Acme Orders examples, and document the layers. No engine implementation: classification stays a contract an LLM or an external classifier can fulfill.

## Dependencies and analysis

- Validator required-file list, allowed work-item fields and routing derivation are coupled with the new contract files; schema, validator and templates must land in the same wave.
- Examples depend on the derivation rule (their classification values must derive their routing).
- Docs depend on the final contract vocabulary; documentation lands after the contracts.
- `AGENTS.md` and adapters stay thin: pointers only, no policy copied.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave |
| --- | --- | --- | --- | --- |
| S1 | technical-planner | none | Ten contract files exist under .context/classification/ and .context/interaction/; no duplication of policy MUSTs | 1 |
| S2 | technical-planner | S1 | Schema accepts new optional fields; validator enforces enums, derivation and required contract files; templates carry classification | 2 |
| S3 | technical-planner | S2 | New validator tests pass; legacy items without classification stay valid | 3 |
| S4 | technical-planner | S2 | Intake, start-conversation and preflight reference the layers; INDEX.md and AGENTS.md point without copying rules | 3 |
| S5 | technical-planner | S2 | Six example cases validate, including human decision, critical gate and reclassification | 3 |
| S6 | technical-planner | S4 | Docs, glossary, methodology, customization, upgrading and CHANGELOG updated; links intact | 4 |

Wave 3 runs S3, S4 and S5 in parallel: they touch different files (tests, prompts, examples) with no shared mutable files. The parent integrates all evidence.

## Rollback

Revert of the change set restores the previous contract surface. No data or migration involved; work items created meanwhile remain valid because the new fields are optional.

## Review and security

Independent review compares spec, diff and evidence. Security review not activated: security signal is `none` for this documentation-and-tooling change.

## Operational risks

- Routing derivation is intentionally strict; items with hand-written routing that disagrees will fail validation and need the recorded value corrected.
- Examples that demonstrated only track/type needed classification values consistent with their narratives; each was checked against the derivation.
