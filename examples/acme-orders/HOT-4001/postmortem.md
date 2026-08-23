# Postmortem — HOT-4001

Direct cause: consumer assumed at-least-once delivery was exactly-once. Prevention: document delivery semantics and add an integration test for duplicate events.
