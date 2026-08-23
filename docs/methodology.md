# Methodology

The repository treats context as an engineering dependency. A small, authoritative context is loaded by each phase; the work item stores decisions and evidence; the code and production checks provide proof.

The core loop is:

```text
Intake → Specify → Plan → Preflight → Execute/Test → Verify/Review
       → Release/Deploy → Observe → Learn/Close
```

Agents can accelerate investigation, drafting and implementation. Humans approve intent, risk, release and closure. A phase may return work to an earlier phase, but it must record why.

Every implementation plan is decomposed into small subtasks and dependency-safe waves. Parallel agents work only inside bounded assignments; an integration owner recombines their evidence before verification. Deployment tooling is intentionally outside this kit; the release artifact records readiness for the consuming project's normal Git and deployment process.

The method is deliberately stack- and vendor-neutral. An adopting project owns its architecture, tools, SLAs and operational commands in `.context/project/`.
