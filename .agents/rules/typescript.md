# TypeScript Strict Rules for AI Agents

Strict mode stays on. Fix the type — never suppress the error.

## 1. Zero Tolerance for Type Escapes

- **No `any`**: Never use `any` or `as any`. Use `unknown` with runtime type guard or Standard Schema (Zod/Valibot) validation.
- **No `@ts-ignore`**: Absolutely forbidden. `@ts-expect-error` is allowed ONLY with a mandatory description in tests (e.g., `rpc.test-d.ts`), and ONLY for verifying negative type tests or upstream library bugs.
- **No Unsafe Type Assertions (`as T`)**: Avoid `as T` unless implementing internal type gymnastics where TypeScript inference cannot follow, with clear type safety invariants maintained.
- **No Non-Null Assertion (`!`)**: Avoid `!` operator where possible. Handle `null` and `undefined` using optional chaining (`?.`), nullish coalescing (`??`), or explicit runtime checks.

## 2. Array & Record Safety

- **Unchecked Index Access Enabled**: `noUncheckedIndexedAccess` is active. Array indexing (`arr[0]`) or dynamic object lookup (`map[key]`) returns `T | undefined`.
- Always verify or handle `undefined` before accessing properties on indexed access results.

## 3. Schema & Validation Support

- Support Standard Schema specification (v1) compatible validators (Zod, Valibot, ArkType, etc.).
- Validate input/output parameters cleanly when schemas are provided.

## 4. Functions & Return Types

- **Explicit Return Types**: Always declare return types for public exported functions and API helpers.
- **No Implicit Returns**: Every code path in a function must explicitly return a value.

## 5. Promises & Async Safety

- **No Floating Promises**: Every promise must be handled: `await` it, return it, or attach `.catch()`.

## 6. Type Definitions & Design

- **Prefer Discriminated Unions**: Model state variations using tagged unions (`{ success: true; data: T } | { success: false; error: Error }`).
- **Type-only Imports**: Use `import type` (separate from value imports) — enforced by Oxlint.
- **Type Tests**: Maintain both runtime tests (`*.test.ts`) and static type tests (`*.test-d.ts`) using `vitest`.

## 7. Operational Escalation

- Don't modify `tsconfig.json` strictness, `oxlint.config.ts` severities, or bypass checks to force a task to pass — escalate instead (see `AGENTS.md` → Escalation).
