# Plan: Immediate classification, context routing and progressive disclosure

Routing is `extended` (cross-module impact on the kit's contract surface). The plan performs dependency analysis, plans waves, and keeps every subtask's context manifest column minimal.

## Approach

Add the context-routing contract layer; split decision category from execution state and derived from effective routing in the existing contracts; extend schema and validator with the routing/override/context invariants; map compact handoffs onto the existing subtask table (optional context-domains column); migrate templates and examples; document everything and add the worked end-to-end example.

## Dependencies and analysis

- The catalog table is the validator's source for valid domain names, so the catalog must land before manifest validation is exercised.
- Schema, validator and templates must land in the same wave to keep all work items consistent.
- The interaction split (categories vs states) touches decision-policy, README, escalation and glossary together to avoid dangling references to BLOCKED-as-category.
- Examples migrate to the new routing/context shape; legacy shape acceptance is covered by dedicated tests.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| S1 | technical-planner | none | Four context-routing contracts exist; catalog table is parseable | 1 | core |
| S2 | technical-planner | S1 | Interaction contracts carry five categories plus execution states with formal precedence | 2 | core |
| S3 | technical-planner | S1 | Schema defines routing and context objects; validator enforces derivation, override direction, manifest invariants and handoff domains; templates migrated | 2 | core,project |
| S4 | technical-planner | S3 | 18 new validator tests pass; prior 30 tests unchanged | 3 | core,project,testing |
| S5 | technical-planner | S3 | Acme examples migrated; end-to-end example demonstrates all scenarios | 3 | core,project |
| S6 | technical-planner | S2 | Docs, glossary, methodology, orchestration, compatibility, customization, upgrading, README, INDEX, AGENTS clause, CHANGELOG updated | 3 | core,project |

Wave 3 runs S4, S5 and S6 in parallel: distinct files, no shared mutable boundaries. The parent integrates all evidence.

## Rollback

Single revert. Optional fields and a new contract directory; no migration is forced on existing items.

## Review and security

Independent review compares spec, diff and evidence. Security signal is `none`; no security boundary changes.

## Operational risks

- Budget maxima are structural (3/5/7 required domains); a legitimate need beyond a maximum requires an explicit budget bump in `budgets.md`, not silent overload.
- Catalog parsing couples the validator to the table format; a catalog-format test covers it.
