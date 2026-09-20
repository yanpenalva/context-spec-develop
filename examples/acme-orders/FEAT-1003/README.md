# FEAT-1003 — GDPR customer data export

Demonstrates a `CRITICAL_HUMAN_GATE`: the feature handles sensitive personal data, so classification sets `security=sensitive` and the interaction protocol stops the agent at the sensitive-data boundary. The agent prepares evidence and waits; it neither proceeds nor implies consent.

## Outcome record

The work item stays blocked until the data-protection owner accepts the sensitive-data boundary and approves the security review path required by `security_reviewer.required_when` in `.context/orchestration/config.json`.
