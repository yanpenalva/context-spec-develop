# Discovery: Classification Layer and Human Interaction Protocol

## Problem

The kit classifies only track, type and risk at intake. Agents have no declarative contract for complexity, blast radius, security signal or classification confidence, and no deterministic rule that selects how deep the workflow must run. Questioning behavior exists as policy (`questioning-and-evidence.md`) but has no operational protocol: no decision taxonomy, no standard question format, no explicit uncertainty model, no escalation contract and no reclassification record. Behavior therefore varies by harness and by model.

## Evidence

- `work-item.schema.json` carries only track, type, risk, severity and lifecycle fields.
- `scripts/validate_context.py` validates no classification dimensions and no routing.
- `prompts/intake.md` stops at track/type plus owner, risk and Git mode.
- `policies/core/questioning-and-evidence.md` defines when to ask but not how to present a decision or how to classify uncertainty operationally.
- `workflows/core.md` runs the same gate depth for every request; nothing scales depth with the work.
- `orchestration/config.json` keeps `security_reviewer.required_when` as a free string with no upstream signal that produces it.

## Affected audience

Adopting teams and any compatible agent or harness that follows `AGENTS.md` into `.context/`.

## Constraints

- Preserve `.context/` as the canonical source and `AGENTS.md` as a thin adapter.
- Preserve existing gates, MUSTs, Git safety and human approval boundaries.
- No coupling to any agent product, model or vendor.
- Backward compatible: existing work items without the new fields stay valid.

## Hypothesis

A declarative classification contract plus a canonical interaction protocol, both wired into intake, preflight and the existing policies, make agent behavior consistent across harnesses without a parallel system.

## Expected value

- Same request classified and routed the same way by any harness.
- Fewer unnecessary questions; material decisions surfaced in a standard format.
- Depth of planning, review and security checks scales deterministically with the work.

## Success signal

- `python3 scripts/validate_context.py --strict --examples` passes with the new contracts required files, schema fields and validator checks in place.
- `python3 -m unittest discover -s tests` passes including new classification, routing, reclassification and backward-compatibility cases.
- The Acme Orders examples demonstrate minimal, standard, extended, human-decision, critical-gate and reclassification handling.
