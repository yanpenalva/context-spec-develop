# Impact

Impact measures blast radius: how far the consequence spreads if the change is wrong. Impact is not complexity and not risk. A one-line rename of a public constant can be `low` complexity with `system` impact; a intricate local algorithm rewrite can be `high` complexity with `local` impact.

## Values

| Value | Meaning |
| --- | --- |
| `local` | Contained within one function, file or configuration value; failures are visible and bounded there. |
| `module` | Affects one module or component and its direct consumers within the same boundary. |
| `cross-module` | Reaches multiple modules or services; a failure propagates across boundaries. |
| `system` | Affects the whole system, shared platform, another product, external consumers or production data globally. |

## Criteria

- **Consumers**: who depends on the changed behavior — one call site, one module, many modules, external systems.
- **Contracts**: public APIs, schemas, CLIs, file formats or events that others build on.
- **Data**: whether shared or persistent data can be observed differently.
- **Operations**: whether infrastructure, deployment or observability behavior changes.
- **Rollback reach**: how much of the system a rollback must touch.

## Relation to existing concepts

- `severity` grades the observed impact of an active Support incident; `impact` here grades the blast radius of a proposed change. They are related but distinct: do not copy severity into impact.
- `risk` grades consequence and uncertainty of proceeding; impact feeds that judgment without replacing it (see [`risk.md`](risk.md)).

## Examples

- Fix a wrong label in one screen: `local`.
- Change a module's internal caching strategy: `module`.
- Change a shared auth middleware used by every service: `cross-module`.
- Change a public event schema consumed by external integrations: `system`.
