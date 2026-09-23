# Stack and Tooling

Record the supported languages, frameworks, databases, infrastructure, package managers and versions. Keep this file factual and current.

| Area | Technology | Supported version | Validation command |
| --- | --- | --- | --- |
| Runtime | Node.js | `>=22` (release workflow uses 24) | `npm test` |
| Package | TypeScript, ECMAScript modules | TypeScript `^5.8.3` | `npm run build` |
| Validator | Python 3 | Version constraint `NOT FOUND` | `python3 -m unittest discover -s tests` |
| Persistence | Repository filesystem (Markdown, JSON and package assets) | N/A | `python3 scripts/validate_context.py --strict --examples` |
| Frontend | None documented | N/A | N/A |
| CI/CD | GitHub Actions; npm and GitHub Pages publishing workflows | GitHub-hosted Ubuntu runner; action versions are pinned by major | `npm ci`, `npm test`, `npm run check`, Python unit tests and context validation |

Do not put secrets, credentials or environment-specific tokens here.
