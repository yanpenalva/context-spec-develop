# Quality Configuration

The normative, framework-neutral baseline for all code work is .context/policies/core/code-quality.md. CSD's defaults include no else/elseif branches, immutable bindings where possible, explicit types, strict domain boundaries, named constants and closed domain types, documentation, and the structural review thresholds in that policy.

## Gates

Coverage and duplication limits are percentages (80 means 80%); complexity limits are analyzer-specific numeric thresholds. The values below record this repository's configured tools and analyzer gates, not the CSD policy baseline.

- Static analysis tool and command: NOT FOUND
- Formatter/linter and command: NOT FOUND
- Test command: npm test; CI additionally runs python3 -m unittest discover -s tests and python3 scripts/validate_context.py --strict --examples.
- Configured new-code cognitive complexity maximum: NOT FOUND
- Configured new-code cyclomatic complexity maximum: NOT FOUND
- Configured new-code coverage minimum: NOT FOUND
- Configured new-code duplication maximum: NOT FOUND
- Quality gate owner: NOT FOUND

The CSD code-quality policy supplies opinionated default review ceilings when a language analyzer is unavailable. Adopting repositories may change their local canonical policy through a reviewed change; record the rationale and owner without duplicating the normative thresholds here. These defaults are not measured analyzer results or active SonarQube settings. This project requires no regression. If a configured project gate cannot be met, record an approved exception with an expiry date; unknown project-specific commands remain NOT FOUND.
