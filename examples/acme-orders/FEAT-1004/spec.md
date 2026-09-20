# Specification: Discount field on order lines

## Objective

Represent negotiated discounts as structured, permissioned values on order lines instead of manual price adjustments.

## Scope

- Optional discount amount and reason per order line, settable by the merchant role.
- Totals computed with the discount applied and audited.
- Order-line payload published to partners carries the discount field.

## Out of scope

- Discount campaigns or coupons.
- Retroactive edits to settled orders.

## Evidence

- Manual adjustment volume recorded in the internal tool.
- Orders webhook publishes the order-lines payload verbatim to partner integrations (confirmed in the webhook publisher and the partner integration guide).

## Rules and contracts

- Public contract: the webhook order-line object gains an optional `discount` field; partners tolerant of new fields are unaffected, and the partner changelog documents it before release.
- Discount changes are audited with actor, previous and new values.
- Totals never go negative; validation rejects discounts above the line amount.

## Security impact

Relevant. The field crosses into partner-facing payloads; authorization for setting discounts uses the existing merchant role. Security implications are analyzed in spec and review per `policies/core/security-privacy.md`.

## Tests

- Unit: totals with discount, boundary values, rejection above line amount.
- Contract: webhook payload schema with the optional field; partner changelog updated.
- Audit: discount change writes the audit record.

## Acceptance criteria

1. Merchant can set a discount within validated bounds.
2. Webhook consumers receive the documented optional field.
3. Revenue report includes structured discounts.
