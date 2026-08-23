# Migration from a Project-Specific Context

Many project-specific AI context layouts contain reusable process rules beside project-specific stack, domain and history. Migrate by classification:

| Existing material | Destination |
| --- | --- |
| Agent posture and workflow stages | `.context/workflows/` and `.context/prompts/` |
| Stack, architecture, security and testing facts | `.context/project/` placeholders |
| Domain modules and glossary | Project-owned context, not the public core |
| ADR and history formats | Templates or project documentation |
| Real work-item specs and progress | Keep private or replace with fictional fixtures |

After migration, run the validator, complete one Product walkthrough and one Support walkthrough, then remove stale duplicate instructions from the adopter repository.

Do not publish the source context, internal identifiers, real work items, credentials or incident details as examples. This public core intentionally contains no company, domain or stack profile; add a separately reviewed profile only when it is useful to more than one adopting project.
