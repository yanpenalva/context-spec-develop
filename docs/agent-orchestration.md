# Agent Orchestration

`context-spec-develop` is designed as a conversation-first system. The user provides decisions; the orchestrator performs repository mechanics and coordinates bounded execution.

## Startup sequence

```text
AGENTS.md
  read orchestration config
  choose conversation profile
  ask missing startup decisions
  classify Product/Support work
  create work-item directory and templates
  specify and plan
  split into dependency-safe waves
  delegate bounded subtasks
  integrate evidence
  verify, review, release and observe
```

The authoritative startup contract is `.context/prompts/start-conversation.md`. The orchestrator must not invent a work-item ID, owner, permission, contract or approval. It may propose values and ask the user to confirm them.

## Configuration

Edit [`.context/orchestration/config.json`](../.context/orchestration/config.json) to select:

- `assignments.orchestrator`: who routes the conversation and coordinates agents;
- `assignments.planner`: who owns specification and plan quality;
- `assignments.executor`: which agents may implement/test and how they are selected;
- `assignments.reviewer`: who reviews independently;
- `assignments.security_reviewer`: when security/privacy review is added;
- `assignments.release_approver`: human authorization boundary;
- `subagents.max_parallel`: maximum parallel assignments per wave;
- `startup.auto_create_*`: whether the orchestrator creates work-item directories and copies templates;
- `git.human_approval_required_before_push`: push authorization.

Agents and profiles are separate choices. `agent` identifies the tool/runtime; `profile` identifies the collaboration role. A project can use Codex as orchestrator, another compatible agent as executor and a human as release approver.

## Automatic work-item creation

When startup decisions are complete, the orchestrator:

1. derives an ID using `config.work_item_id_pattern` and confirms collisions;
2. creates `.context/work/<id>/`;
3. copies the common and Product/Support templates required for the current phase;
4. writes `work-item.json` with selected profile, track, type, owner, risk and status;
5. opens the intake/specification artifact and reports the created path;
6. never creates deployment infrastructure or platform-specific CI files.

If the directory already exists, the orchestrator opens it and asks before changing its phase or overwriting an artifact.

## Subagents and waves

Use one parent work item. Keep subtasks small enough to verify independently. A wave can run in parallel only when dependencies and mutable boundaries do not conflict. Each subagent receives only its assigned files/context, returns exact commands and evidence, and stops on scope change. The parent integrates; an independent reviewer checks the final diff.

The graph may live in a review-graph tool or the dependency table in `plan.md`. The tool is optional; the ownership and evidence contract is not.

## Git and release boundary

Agents may prepare changes and commits according to project policy. `git push`, production deployment, destructive commands and external communication require the configured human approval. Deployment implementation remains outside this kit.
