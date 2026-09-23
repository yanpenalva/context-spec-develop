# Product Discovery — FEAT-9015 Make CSD context discovery idempotent and framework-agnostic

## Problem

- User/operator: Developers and AI coding agents using repositories that already contain context instructions.
- Situation: CSD bootstrap and MCP repository workflow currently look for `.context/` paths directly and bootstrap materializes the packaged `.context/` tree.
- Pain or opportunity: Repositories using another valid layout can be treated as uninitialized, causing duplicate or conflicting context trees and making bootstrap unsafe to retry.

## Evidence

- Observation: `src/installer.ts` copies package `.context/` files into `<root>/.context/`; it has no layout discovery step.
- Observation: `src/mcp/repository.ts` directly reads `.context/` for readiness, work items, context collection and artifact writes.
- Observation: Existing bootstrap tests cover `.context/` only; MCP tests seed and read `.context/work/` directly.
- Source: current repository implementation and tests inspected on 2026-09-23.
- Confidence and gaps: High for the requested behavior. No field usage or adoption metrics were provided; behavior-level tests are the success measure.

## Hypothesis

If CSD discovers and validates existing context layouts through normalized adapters before bootstrap, then repositories with existing instructions can continue in place without duplicate trees or overwritten files, because context selection becomes deterministic and materialization becomes a no-op when valid context already exists.

## Success

- Primary metric: Focused tests pass for all five supported layouts, marker validation, conflicts/precedence, idempotent discovery/bootstrap, ownership conflicts and confirmation gates.
- Baseline: No adapter discovery exists; bootstrap assumes `.context/`.
- Target: Valid existing contexts resolve with stable paths and no writes; empty repositories receive an exact preview and remain unchanged until explicit confirmation.
- Observation period: Local automated test and validation runs for this change.

## Constraints and alternatives

- Constraints: Preserve public APIs and native `.context/` behavior; migration is opt-in; no ecosystem-specific discovery; protect user, dependency and generated files.
- Alternatives considered: Force conversion into `.context/` (rejected by request); select the first matching directory (rejected because ambiguous); add explicit, composable adapters and normalized discovery (selected).
- Why now: The supplied task defines compatibility and idempotence as core bootstrap invariants.
