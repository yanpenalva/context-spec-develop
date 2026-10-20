# Prompt Contract: Verify and Review

## Inputs

Request, spec, plan, progress, diff, test and quality-command evidence, and review checklist.

## Produce

verification.md and review.md with evidence, correctness, regressions, security, scope drift, risks and a verdict. Separate CSD gate evidence from engineering review against referenced engineering criteria; record any unresolved engineering-source limitations as NOT FOUND.

For code changes, review the diff against referenced engineering criteria and configured project quality gates (retaining legacy .context/policies/core/code-quality.md until migration). Check control flow, immutability and types, domain ownership, structural thresholds, error/security behavior and required documentation. Record exact commands, paths, exit status and limitations. A policy or documentation-only change must verify canonical/starter-template consistency and run the required context validator; do not claim application tests ran.

## Constraints

Do not modify implementation automatically. Findings must identify location, evidence, impact and the smallest correction.
