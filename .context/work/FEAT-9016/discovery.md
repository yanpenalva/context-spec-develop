# Product Discovery — FEAT-9016 Make code quality standards CSD defaults

## Problem

- User/operator: CSD maintainers and developers using CSD in adopting repositories.
- Situation: CSD has a general code-quality policy, but its control-flow policy allows `else`/`elseif`, several structural limits are advisory, and the execution contract does not make the referenced quality checklist a default gate.
- Pain or opportunity: quality expectations vary by task and repository; teams have to restate practices such as immutable bindings, strict domain boundaries, SOLID and detailed documentation.

## Evidence

- Observation, research or data:
  - `/home/hiyan/Development/projects/work/siicv2/.ai/sonarqube.md` labels its limits (15 declarations per production file, 150 lines per function, 500 lines per file, up to three returns and seven parameters) as source-project local policy, not SonarQube defaults; section 4 recommends cyclomatic complexity at most 10 and cognitive complexity at most 15 whenever possible.
  - The source best-practices guide targets functions under 30 lines, treats functions above 50 as extraction candidates, and uses 150 as the hard ceiling; its review checklist also favors guard clauses, explicit types, intent-revealing names, sparse why-comments and suppression discipline. Stack- and framework-specific instructions remain outside CSD core.
  - SIICV2 `.ai/best-practices.md`, `conventions.md` and `code-review-checklist.md` add SOLID/DRY/KISS/YAGNI, guard clauses, no `else`/`elseif`, typing, constants/enums, scoped documentation and review guidance. language- and framework-specific rules are stack-specific.
  - CSD `.context/policies/core/code-quality.md` currently describes structural limits as advisory and permits control-flow alternatives without a default `else` ban; `engineering-principles.md` explicitly permits `else`/`elseif` for symmetric branches.
  - CSD distributes its starter context from `assets/template/.context/`; canonical policy changes must be reflected there.
- Confidence and gaps: High confidence about the transferable source rules and CSD distribution path. The source policy sets no class method ceiling; the user specified 15 methods per class as a CSD default. Keep that distinction explicit and do not attribute the class ceiling to SonarQube. Language-, framework- and project-specific analyzer instructions remain out of the framework-neutral baseline.

## Hypothesis

If CSD makes a language-neutral code-quality baseline normative and routes it into implementation and review, then adopters will apply consistent quality rules by default because the policy, prompts and starter template will agree.

## Success

- Primary metric: CSD canonical and distributed defaults state the same actionable quality contract.
- Baseline: control-flow and structural expectations are partly advisory or absent.
- Target: installed templates and CSD execution/review contracts require no `else`/`elseif`, explicit immutable types and named domain boundaries; documented structural defaults; and detailed API/domain documentation without falsely claiming SonarQube settings.
- Observation period: validate the distributed template and strict context validator at handoff.

## Constraints and alternatives

- Constraints: Keep CSD framework-agnostic; preserve project-specific tooling as `NOT FOUND` unless configured; do not present local thresholds as SonarQube defaults; use the existing policy-exception process for deviations.
- Alternatives considered: Copy the source file verbatim (rejected because it contains rules tied to a specific application stack and local Sonar claims); update only the local CSD context (rejected because adopters receive `assets/template/.context/`).
- Why now: The user explicitly asked to make these quality standards the default behavior of CSD.
