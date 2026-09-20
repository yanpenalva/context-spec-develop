# Discovery: Order cancellation window

## Problem

Support receives daily requests from customers who want to cancel an order moments after placing it. Agents currently cancel manually, without a consistent rule or audit trail.

## Evidence

- Support ticket sample (40 tickets, July): 31 concerned cancellations within one hour of purchase.
- Current API has no cancellation endpoint; agents use an internal admin tool.
- Competitor storefronts publish self-service windows of 15 to 60 minutes.

## Affected audience

Customers placing orders, support agents handling cancellations, and partner integrations that read order state.

## Constraints

- Order state transitions are public contract: partners poll order status.
- Finance reconciles settled orders nightly; cancellations after settlement need refunds.

## Hypothesis

A bounded self-service cancellation window reduces support load and keeps reconciliation deterministic.

## Expected value

Fewer manual cancellations, predictable financial handling, transparent customer expectation.

## Success signal

Manual cancellation tickets drop measurably within one month of release; no partner integration breaks.
