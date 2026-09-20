# Methodology

The repository treats context as an engineering dependency. A small, authoritative context is loaded by each phase; the work item stores decisions and evidence; the code and production checks provide proof.

The core loop is:

```text
Intake → Classify → Route → Specify → Plan → Preflight → Execute/Test
       → Verify/Review → Release/Deploy → Observe → Learn/Close
```

Intake determines the kind of work; classification (`.context/classification/`) describes its complexity, impact, security exposure and confidence, and derives the execution depth. The interaction protocol (`.context/interaction/`) governs every question, assumption, decision and escalation at any phase. Context routing (`.context/context-routing/`) keeps each decision and phase on the minimum sufficient canonical context: classification precedes detailed loading, unrelated domains stay deferred, and handoffs pass compact artifacts instead of conversation history. Material new evidence triggers reclassification, recalculates routing and expands context only where triggered.

Agents can accelerate investigation, drafting and implementation. Humans approve intent, risk, release and closure. A phase may return work to an earlier phase, but it must record why.

Every implementation plan is decomposed into small subtasks and dependency-safe waves. Parallel agents work only inside bounded assignments; an integration owner recombines their evidence before verification. Deployment tooling is intentionally outside this kit; the release artifact records readiness for the consuming project's normal Git and deployment process.

The method is deliberately stack- and vendor-neutral. An adopting project owns its architecture, tools, SLAs and operational commands in `.context/project/`.
