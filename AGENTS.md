# Agent Skills Configuration

## Agent skills

### Issue tracker

Issues and PRDs for this repo live as markdown files in `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo (most repos). See `docs/agents/domain.md`.

## Project Instructions

This repo is a language learning application for English exams. Treat the existing frontend and backend as the source of truth unless the user asks otherwise.

### Project context

- Frontend: React + TypeScript + Vite
- Backend: Spring Boot + Java
- Storage: local files and in-memory or database-backed app state
- Main domain terms: exam papers, sentences, vocabulary, annotations

### Work style

- Read the relevant code, configs, docs, and tests before editing.
- Prefer the repo's existing patterns, helpers, and naming over introducing a new style.
- Keep changes small and focused on the task at hand.
- Avoid unrelated refactors, formatting churn, dependency upgrades, or renames unless they are required.
- If project conventions conflict with generic best practices, preserve the project convention unless there is a clear bug, security issue, or maintainability risk.

### Code quality

- Make types, names, and control flow express intent clearly.
- Prefer structured APIs, parsers, and existing utilities over brittle string manipulation.
- Handle errors explicitly and include enough context to debug failures.
- Keep boundaries clear between UI, business logic, I/O, configuration, and test helpers.
- Use comments only when the reason for a choice is not obvious from the code.

### Testing and validation

- Run the most relevant validation for the change, not necessarily the whole suite.
- Add or update tests when touching shared logic, core flows, or bug fixes.
- If validation cannot be run, say so and explain the remaining risk.

### Git and file safety

- Do not overwrite, delete, or revert user changes unless the user explicitly asks.
- Avoid destructive commands such as `git reset --hard` or force checkout unless explicitly authorized.
- In a dirty working tree, only touch files related to the task.
- Do not create commits, rewrite history, or push branches unless requested.

### Communication

- Keep progress updates short and factual.
- In the final reply, state what changed, how it was verified, what was not verified, and any residual risk.
- If the task has a high-impact ambiguity, explore the repo first and only ask the user when facts cannot be discovered locally.
