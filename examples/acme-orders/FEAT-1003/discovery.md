# Discovery: GDPR customer data export

## Problem

Data-protection requests require exporting all personal data held about a customer. Today the request is fulfilled by ad-hoc database queries by an engineer, which is slow, unauditable and error-prone.

## Evidence

- Three data-protection requests in the last quarter, each taking an engineer half a day.
- Personal data is spread across the orders service, the notifications service and the support tool.

## Affected audience

Customers exercising data rights, the data-protection owner, and the services holding personal data.

## Constraints

- Personal data handling follows `policies/core/security-privacy.md` and the project's legal obligations.
- Export must be auditable and access-controlled; it must not widen who can read personal data.

## Hypothesis

A controlled, audited export flow satisfies data-protection requests faster without increasing exposure.

## Expected value

Data-protection requests answered in hours instead of days, with a complete audit trail.

## Success signal

Requests fulfilled with zero ad-hoc database queries and a reviewable audit record per export.
