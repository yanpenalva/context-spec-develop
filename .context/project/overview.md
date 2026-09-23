# Project Overview

## Identity

- Name: `@owlcodium/context-spec-develop`
- Repository: `yanpenalva/context-spec-develop` (https://github.com/yanpenalva/context-spec-develop)
- Business owner: `NOT FOUND`
- Technical owner: `NOT FOUND`
- Users and operators: Maintainers of the CSD kit and developers and AI coding agents that follow its repository-level workflow.

## Purpose

Provides a reusable, agent-neutral set of context, classification, routing and delivery workflows for AI-assisted software development. It includes an npm CLI/installer, agent activation adapters, an MCP interface and a Python context validator.

Project-owned deployment infrastructure and the behavior of external agent hosts are outside this repository's boundary. The kit documents release readiness but does not deploy adopting projects.

## Environments

| Environment | Purpose | Owner | Data constraints |
| --- | --- | --- | --- |
| Development | Local Node.js/npm and Python checks | `NOT FOUND` | Repository contents; no environment data contract documented |
| Staging | `NOT FOUND` | `NOT FOUND` | `NOT FOUND` |
| Production | Public npm package and GitHub Pages catalog | `NOT FOUND` | `NOT FOUND` |

## Source of truth

Code and canonical workflow source: this repository, especially `src/`, `.context/`, `skill/`, `adapters/`, `scripts/` and `tests/`. Source control and automation: GitHub and `.github/workflows/`. Published package: npm. Product, incident and compliance systems: `NOT FOUND`.
