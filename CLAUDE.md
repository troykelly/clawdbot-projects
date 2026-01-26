# CLAUDE.md — clawdbot-projects

You are Claude Code working in `troykelly/clawdbot-projects`.

## Non-negotiable process

- **Issue-driven development only**: work must map to a single GitHub issue. Do not do “extra” improvements.
- **TDD**: write tests first, then implement.
- **pnpm only**: use `pnpm` for installs/scripts unless a feature is truly npm-only.

## Scope control

- You are currently working on **Issue #1 only** (Bootstrap: choose stack + create initial schema test harness).
- Do NOT implement schema/features for other issues (UUIDv7, contacts, dashboard, etc.) in this branch.

## Security + repo hygiene

- This is a **public repo**. Do not commit secrets, tokens, hostnames, personal data.
- Prefer **parameterized SQL** and safe process execution.
  - Avoid `child_process.exec()`; prefer `execFile`-style helpers.

## GitHub CLI / token

If you need GitHub API/gh access from inside the environment, it must be via runtime env injection:

- Prefer `GITHUB_TOKEN` (works for gh + most tools/MCP). Set `GH_TOKEN` too only if something requires it.

## Deliverables for Issue #1

- Minimal TypeScript backend skeleton
- Postgres 18 local dev via docker-compose
- Migration tool + up/down migrations + rollback story
- Tests that prove:
  - DB is reachable
  - migrations can be applied
- Documentation: how to run the harness locally + in CI

## Commit discipline

- Small commits with clear messages.
- Keep changes minimal and directly tied to Issue #1.
