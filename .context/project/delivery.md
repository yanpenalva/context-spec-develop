# Delivery and Deployment Context

## Release readiness

The npm release workflow runs on `v*.*.*` tags, installs dependencies on Node.js 24, runs `npm run check` and `npm test`, then publishes with npm provenance. The catalog workflow publishes `catalog/` to GitHub Pages on `main` changes or manual dispatch. Release approver and environment protection rules: `NOT FOUND`.

## Rollback

- Trigger conditions: `NOT FOUND`
- Owner with authority: `NOT FOUND`
- Technical procedure: `NOT FOUND`
- Data compatibility constraints: `NOT FOUND`

## Change classes

| Class | Examples | Required approval | Observation |
| --- | --- | --- | --- |
| Normal | `NOT FOUND` | `NOT FOUND` | `NOT FOUND` |
| High risk | `NOT FOUND` | `NOT FOUND` | `NOT FOUND` |
| Hotfix | `NOT FOUND` | `NOT FOUND` | `NOT FOUND` |
