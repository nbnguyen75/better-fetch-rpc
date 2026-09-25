# AGENTS.md

Project harness for reliable agent-assisted development on `better-fetch-rpc`
(TypeScript + @better-fetch/fetch RPC client library, pnpm-managed).

## Startup Workflow

Before writing code:

1. **Confirm working directory** with `pwd` / `Get-Location`
2. **Read this file** completely
3. **Read project README & package.json**:
   - `README.md` — API overview, schema support, usage patterns
   - `package.json` — scripts and dependencies
4. **Review recent commits** with `git log --oneline -5`
5. **Run verification baseline**: `pnpm run typecheck` and `pnpm run test`

If baseline verification is failing, repair that first before adding new scope.

## Working Rules

- **Strict TypeScript**: Keep zero-tolerance on type leaks; maintain exact type inference and autocomplete for RPC routes.
- **Type-level Testing**: Include both runtime tests (`src/*.test.ts`) and type tests (`src/*.test-d.ts`).
- **Follow Standard Schema**: Keep compatibility with Standard Schema v1 (Zod, Valibot, etc.).
- **Minimal Dependencies**: Use `@better-fetch/fetch` as peerDependency, avoid bloated external libraries.
- **Verification required**: Don't claim done without running full check suite (`pnpm run typecheck && pnpm run test && pnpm run lint`).
- **Leave clean state**: Next session must be able to run tests and build cleanly.

## Skills & Rules

- **Always read `.agents/rules/*.md`** (`typescript.md`, `security.md`, `phase-gate.md`, `ponytail.md`, `improve.md`).
- **Mandatory skills** (always active when relevant): `improve`, `modern-javascript-patterns`, `typescript-advanced-types`.
- **Skill routing** — load ONE skill per task:

| Task                               | Skill                                  |
| ---------------------------------- | -------------------------------------- |
| Advanced Type Inference & Generics | `typescript-advanced-types`            |
| Modern JS / TS patterns            | `modern-javascript-patterns`           |
| Codebase & API Design              | `codebase-design`                      |
| Refactor / API Simplification      | `refactor`                             |
| Debugging / Type issue diagnosis   | `diagnosing-bugs`                      |
| Code review & Quality check        | `code-review-and-quality`              |
| Codebase improvement               | `improve`                              |
| Documentation & Tech Writing       | `better-writing`, `writing-for-agents` |
| Research / Concept exploration     | `research`                             |

- Assets under `.agents/` and `.claude/` are tracked in `skills-lock.json`.

## Verification Commands

```bash
# Typecheck
pnpm run typecheck

# Unit tests + type tests
pnpm run test

# Lint & Format check
pnpm run lint
pnpm run format

# Build bundle
pnpm run build
```

Active check pipeline:

```bash
pnpm run typecheck && pnpm run test && pnpm run lint
```

## Escalation

If you encounter:

- **Type system conflicts**: Consult `typescript-advanced-types` or ask the user for architectural direction.
- **Breaking changes to public API**: Confirm with user before altering route schema contracts or client return types.
- **Dependency question**: Check `package.json` first before adding any runtime dependency.
- **Test failures**: Inspect type differences carefully in `test-d.ts` before patching implementations.
