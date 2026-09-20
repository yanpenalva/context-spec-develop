# Specification: Order cancellation window

## Objective

Let customers cancel an order themselves within a bounded window, with deterministic financial handling and no partner-facing surprise.

## Scope

- Self-service cancellation for orders in `placed` state inside the window.
- Server-side enforcement with an audit record per cancellation.
- Order state transition visible through the existing public order status API.

## Out of scope

- Refund flows after settlement (existing refund process continues to own those).
- Retroactive changes to orders already settled before release.

## Evidence

- Discovery ticket sample: 31 of 40 cancellation requests arrived within one hour of purchase.
- Order state machine is a public contract; partners poll order status.
- Nightly finance reconciliation starts at 02:00 and treats settled orders as final.

## Interaction record — decision required

Classification: `complexity=medium`, `impact=module`, `security=none`, `confidence=high`, `routing=standard`. During specification, one point mapped to `HUMAN_DECISION_REQUIRED` in `.context/interaction/decision-policy.md`: the window boundary and its enforcement change behavior and the public contract, with valid alternatives on both sides.

Decision required: cancellation window boundary and enforcement model.

Evidence:
- 31 of 40 sampled cancellation requests arrived within 60 minutes of purchase.
- Partners poll order status; a new `cancelled` transition is observable either way.
- Finance treats settled orders as final after 02:00 reconciliation.

Unknown:
- Whether partners hold long-lived automation that reacts to any new order state transition.

Options:

A. Hard 60-minute cutoff enforced server-side; `cancel` rejected after the window with an explicit error.
Impact: deterministic and auditable; late customers must use support; partners see one new transition and one rejection path.

B. Soft window: cancel allowed until settlement; requests inside the window auto-approve, later ones queue for finance review.
Impact: more customer-friendly; introduces a queue, finance workflow and non-deterministic state transitions partners must handle.

Recommendation: A. Evidence shows most demand sits inside one hour, option A keeps the state machine deterministic, and B adds a finance queue that outlives this feature's scope. Trade-off: some late requests return to manual support handling.

Question: approve a hard 60-minute server-enforced cancellation window, or require the settlement-queued soft window?

Decision (product owner, recorded 2026-09-20): Option A. Rationale: deterministic contract for partners and finance; manual handling remains for the tail. The alternative was rejected for scope and non-determinism.

## Rules and contracts

- Cancellation only from `placed`; rejected after the window with error `cancellation_window_closed`.
- Every cancellation writes an audit record containing actor, timestamp and order id.
- Public order status API documents the new `cancelled` transition before release.

## Security impact

None. No authentication, authorization or sensitive-data boundary changes; existing session checks cover the new endpoint.

## Tests

- Unit: window boundary inclusive/exclusive behavior around 60 minutes.
- Contract: `cancelled` transition and rejection error in the public API response.
- Integration: partner polling sees the documented transition; audit record written.

## Acceptance criteria

1. Customer can cancel within the approved window without support contact.
2. Cancellation after the window fails with the documented error.
3. Audit record exists for every cancellation.
4. Public API documentation includes the new transition before release.
