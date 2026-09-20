# Specification: GDPR customer data export

## Objective

Produce an audited, access-controlled export of all personal data held about a customer, fulfilable by the data-protection owner without engineer intervention.

## Scope

- Export across orders, notifications and support-tool data for one customer.
- Access restricted to the data-protection role; every export attempt audited.
- Delivery through the existing secure document channel; no new storage of exports.

## Out of scope

- Data deletion or retention changes (separate legal process).
- Backups and data-warehouse copies, handled by their existing lifecycle.

## Evidence

- Personal data locations confirmed in the orders and notifications services and the support tool.
- Current ad-hoc process observed in three completed requests.

## Interaction record — critical gate

Classification: `complexity=medium`, `impact=cross-module`, `security=sensitive`, `confidence=high`, `routing=extended`. Per `.context/interaction/decision-policy.md` this work maps to `CRITICAL_HUMAN_GATE`: it touches a sensitive-data boundary. Per `.context/interaction/escalation.md` the agent stopped and requires explicit human authorization before specification advances.

What changed: the feature cannot proceed on product approval alone.

Evidence:
- Export reads and assembles personal data from three services.
- `policies/core/security-privacy.md` governs personal-data handling; the export widens the set of people who can trigger assembly of that data.

What is affected: specification, plan, security review (`security_reviewer.required_when`), release authorization and the audit design.

Can work continue safely: no — not past this boundary.

Human decision required: the data-protection owner MUST accept the sensitive-data boundary and confirm the export audience, delivery channel and audit requirements. The independent security reviewer MUST then review the plan before implementation.

## Rules and contracts

- No export leaves the boundary until the gate above is recorded as approved in this work item.
- Security review is a required gate on this item regardless of routing.

## Security impact

Sensitive. This feature exists inside a sensitive-data boundary; the gate above governs it.

## Tests

- Authorization: only the data-protection role can trigger or read an export.
- Audit: every attempt, successful or denied, produces an audit record.
- Completeness: export content matches the documented data map for a sample customer.

## Acceptance criteria

1. Recorded human authorization for the sensitive-data boundary before planning starts.
2. Independent security review of the plan before implementation.
3. Authorization, audit and completeness tests pass with real evidence.
