# Discovery: Discount field on order lines

## Problem

Merchants negotiate per-order discounts, but support applies them as manual price adjustments that leave no structured record and break revenue reporting.

## Evidence

- Revenue report excludes 214 manual adjustments from last quarter.
- Support applies adjustments through an internal tool with a free-text reason.

## Affected audience

Merchants with negotiated discounts, finance reporting, and systems consuming order-line data.

## Constraints

- Order lines are part of the order payload published to partners.
- Finance reconciles order totals nightly.

## Hypothesis

A structured, permissioned discount field on order lines makes discounts explicit, auditable and reportable.

## Expected value

Accurate revenue reporting and an auditable discount trail.

## Success signal

Manual adjustments for negotiated discounts drop to zero; revenue report includes structured discounts.
