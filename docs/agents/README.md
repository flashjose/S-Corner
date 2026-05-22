# Agent Skills Configuration

This directory contains configuration files for Matt Pocock's engineering skills.

## Files

- `issue-tracker.md` - Configuration for the issue tracker (local markdown files)
- `triage-labels.md` - Mapping of triage labels
- `domain.md` - Domain documentation consumption rules

## Usage

These files are read by the following skills:
- `to-issues` - Creates issues from plans
- `triage` - Processes incoming issues
- `to-prd` - Creates PRDs from context
- `diagnose` - Debugs issues
- `tdd` - Test-driven development
- `improve-codebase-architecture` - Finds refactoring opportunities
- `grill-with-docs` - Creates domain documentation

## Editing

You can edit `docs/agents/*.md` directly. Re-running the setup skill is only necessary if you want to switch issue trackers or restart from scratch.