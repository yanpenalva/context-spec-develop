# Plan: Discount field on order lines

Routing is `extended` after reclassification: the plan performs dependency analysis, plans waves, and adds independent review plus security review to the gate sequence.

## Approach

Smallest viable change: extend the order-line model with optional discount data, enforce validation in the totals calculator, publish the field in the webhook payload, and audit changes. No schema migration: the discount travels as structured JSON alongside existing line attributes.

## Dependencies and analysis

- Totals calculator and order webhook share the order-line model; changes are coupled.
- Partner integrations depend on the payload shape; the changelog must land before release.
- Finance reporting reads the totals table, not order lines directly; no coupling.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave |
| --- | --- | --- | --- | --- |
| S1 | orders-team | none | Model and validation unit tests pass | 1 |
| S2 | orders-team | S1 | Totals calculator tests pass with discount boundaries | 2 |
| S3 | integrations-team | S1 | Webhook payload contract test passes; partner changelog drafted | 2 |
| S4 | orders-team | S2, S3 | Audit record written on discount change; end-to-end test passes | 3 |

Wave 2 runs S2 and S3 in parallel: they touch different modules and no shared mutable files. The parent integrates evidence before wave 3.

## Rollback

Single deploy revert removes the field from new payloads; partners tolerate its absence as optional. No data rollback needed: discounts recorded before revert remain valid history.

## Review and security

Independent review of the full diff. Security review of the partner-facing payload and the discount authorization path, per the `relevant` signal.

## Operational risks

- A partner with strict payload validation could reject the new field; the changelog and a partner smoke test mitigate.
- Discount misuse by compromised merchant accounts is bounded by the audit trail and existing role checks.
