# Contributing

Contributions should improve the reusable methodology, templates, examples or validator without adding assumptions tied to one company or stack.

Before opening a pull request:

- explain the user or maintainer problem;
- keep canonical rules in `.context/` and adapters thin;
- update the relevant documentation and changelog entry;
- add or update validator fixtures when behavior changes;
- run `python3 -m unittest discover -s tests`;
- run `python3 scripts/validate_context.py --strict --examples`.

New workflow stages, schema fields or required artifacts need an explicit migration note. Do not add integrations to external project-management or deployment platforms to the core template.
