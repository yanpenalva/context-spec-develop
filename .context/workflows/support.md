# Support Workflow

Use this overlay for defects and operational impact. Triage determines the path.

Select Support during intake for a reproducible defect, active degradation/outage or urgent production correction. Ask whether impact is active before choosing Bug versus Incident or Hotfix.

| Type | Meaning | First action |
| --- | --- | --- |
| Bug | Reproducible defect without active service impact | Triage and reproduce |
| Incident | Active degradation, outage or user impact | Contain and communicate |
| Hotfix | Urgent production change for an active or critical impact | Minimal spec, rollback and targeted validation |

## Bug

Complete `triage.md` and `reproduction.md` before planning a normal fix. Preserve the original evidence and distinguish observed behavior from hypothesis.

## Incident

Create `incident.md` immediately. Name an incident commander, impact, severity, timeline, containment action, communication channel and escalation path. A code change is optional; if needed, attach the common delivery artifacts.

## Hotfix

The expedited path may reduce documentation depth, but never skips a minimal spec, risk decision, targeted test, reviewer, production approval, rollback plan or post-deploy observation. Complete the full incident record and postmortem before closure.

## Postmortem

`postmortem.md` records systemic cause, contributing conditions, detection gaps and owned preventive actions. It must not be a blame document.
