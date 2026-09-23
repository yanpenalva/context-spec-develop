# Testing Context

## Test strategy

The repository has Node.js tests for the CLI, installer, registry and MCP server, plus Python unit tests for repository validation and benchmark code. GitHub Actions runs the checks below on pushes and pull requests.

| Change area | Required checks | Owner | Evidence location |
| --- | --- | --- | --- |
| TypeScript CLI, installer and MCP | `npm test` | `NOT FOUND` | `verification.md` |
| Python validator and repository checks | `python3 -m unittest discover -s tests` and `python3 scripts/validate_context.py --strict --examples` | `NOT FOUND` | `verification.md` |
| Generated registry/catalog | `npm run check` and `git diff --exit-code -- registry catalog` | `NOT FOUND` | `verification.md` |

## Test constraints

- Tests that must run before merge: GitHub Actions runs `npm test`, `npm run check`, generated-file diff check, Python unit tests and strict context validation.
- Tests that must run before deploy: `NOT FOUND`
- Production smoke checks: `NOT FOUND`
- Known gaps: `NOT FOUND`
