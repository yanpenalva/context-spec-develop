# Questioning Protocol

Normative rule: `policies/core/questioning-and-evidence.md` — inspect before asking; ask only decisions that can change scope, behavior, risk, ownership, authorization or delivery. This file defines how to apply it.

## The rule

> Do not ask because information is missing. Ask when the missing information can materially change the correct path and cannot reasonably be discovered from available evidence.

## Investigation first

Before considering a question, inspect, in order:

1. the repository (code, tests, configuration, history);
2. `.context/project/` and applicable policies and schemas;
3. the current work item and its artifacts;
4. specifications and plans already approved;
5. existing implementation and its behavior;
6. available runtime evidence (logs, command output, test results).

A question answerable by inspection is a defect in the conversation, not a decision. Do not ask "how do you want me to implement this?" when the repository, spec or plan determines the answer.

## When a human question is required

Ask only when the decision category is `HUMAN_DECISION_REQUIRED` (see [`decision-policy.md`](decision-policy.md)) and the options differ materially in behavior, requirements, architecture, cost, contract, UX, compatibility or scope. Low confidence alone never justifies a question: route it through [`uncertainty.md`](uncertainty.md) first.

## Question format

For material decisions, present:

```text
Decision required: <decision>

Evidence:
- <known fact>
- <known fact>

Unknown:
- <material unknown>

Options:

A. <option>
Impact: <behavior, contract, risk, cost>

B. <option>
Impact: <behavior, contract, risk, cost>

Recommendation: <option, only when evidence supports it, with trade-offs>

Question: <one specific, decision-changing question>
```

Adapt depth to risk. For simple binary choices:

```text
Decision required: <decision>

A. <option>
B. <option>

Recommended: A because <evidence-based reason>.

Choose A or B.
```

Do not pad. Every element above must earn its place; drop sections that have no content instead of filling them.

## Recommendation policy

An agent MAY recommend an option when evidence supports it. A recommendation MUST:

- rest on recorded evidence, not preference;
- present the relevant trade-offs;
- distinguish observed fact from inference (see [`uncertainty.md`](uncertainty.md));
- not claim certainty that does not exist.

At a critical human gate, a recommendation never substitutes for the human authorization itself.
