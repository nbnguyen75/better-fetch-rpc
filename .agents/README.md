# better-fetch-rpc Agent Context

Minimal context for agents working inside `better-fetch-rpc`. Works with any agent that reads `AGENTS.md` — not tool-specific.

Read, in order:

1. `AGENTS.md` (repo root — entry point, always read)
2. `.agents/rules/*.md` (always, short — `typescript.md`, `security.md`, `phase-gate.md`, `ponytail.md`, `improve.md`)
3. Relevant skills under `.agents/skills/`: always-active (`improve`, `modern-javascript-patterns`, `typescript-advanced-types`), plus the ONE skill the current task needs — pick it from the routing table in `AGENTS.md` → "Skills & Rules"

Do not load unnecessary context for every task.
