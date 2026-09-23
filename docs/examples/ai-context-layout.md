# Example: a repository using the .ai context layout

CSD can use an existing .ai layout without creating .context/ or copying files during discovery.

    .ai/
      README.md
      workflow.md
      context-routing/
      tasks/
        FEAT-1234/
          work-item.json
        templates/
      scripts/
      config.json
      prompts-base.md

The default .ai markers are README.md plus one of workflow.md, context-routing/, or tasks/. The normalized adapter maps README.md to the index, tasks/ to the work-item root, tasks/templates/ to templates, and workflow.md or prompts-base.md to onboarding sources when present.

Discovery reports missing optional components without forcing installation. Work items and allowlisted artifact writes stay under .ai/tasks/. To bootstrap this layout in a repository with no valid candidate, configure canonicalLayout as .ai and review the preview before using the CLI confirmation option.
