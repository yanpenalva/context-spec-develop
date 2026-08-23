# Observability Context

Define the signals that prove a release is healthy and the signals that trigger rollback or escalation.

| Signal | Source | Healthy threshold | Failure threshold | Owner |
| --- | --- | --- | --- | --- |
| `NOT FOUND` | `NOT FOUND` | `NOT FOUND` | `NOT FOUND` | `NOT FOUND` |

Every release must name a smoke test, an observation window and an escalation path. If a signal does not exist, write `NOT FOUND` and treat the gap as release risk.
