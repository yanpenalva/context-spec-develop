# Acme Orders example

Acme Orders is a fictional order-tracking service used to demonstrate the Support/Product paths and the classification cases without exposing a real project.

| Item | Track/type | Demonstrates |
| --- | --- | --- |
| `FEAT-1001` | Product/feature | Minimal routing: complexity low, risk low, impact local, security none |
| `BUG-2001` | Support/bug | Standard routing: reproduction and normal fix in one module |
| `INC-3001` | Support/incident | Extended routing from system impact; containment without code change |
| `HOT-4001` | Support/hotfix | Extended routing for critical risk; rollback and postmortem |
| `FEAT-1002` | Product/feature | `HUMAN_DECISION_REQUIRED`: two valid options change behavior and contract; decision recorded in spec |
| `FEAT-1003` | Product/feature | `CRITICAL_HUMAN_GATE`: sensitive-data boundary stops the agent pending human authorization |
| `FEAT-1004` | Product/feature | Reclassification: standard planning evidence raises routing to extended, recorded in `work-item.json` |

Each directory contains a compact work-item record and points to the corresponding templates in the repository root. Classification dimensions and routing follow `.context/classification/`; interaction cases follow `.context/interaction/`.
