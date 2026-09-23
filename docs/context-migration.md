# Context layout migration

CSD detects and uses one valid existing layout. It does not copy that context into .context/, rename files, create symlinks, delete user files, or run a migration automatically.

If more than one supported layout is valid, discovery returns a conflict. Review the reported candidates, remove or repair the unintended layout yourself, or explicitly configure a precedence order in csd.config.json. Precedence is disabled by default.

A future migration should be a separate operation with its own read-only preview, exact source and destination inventory, collision and protected-path report, explicit confirmation, ownership policy, and rollback plan. The current bootstrap preview only materializes a configured canonical layout when no valid candidate exists.

See [context discovery](context-discovery.md) for the current status and bootstrap contract.
