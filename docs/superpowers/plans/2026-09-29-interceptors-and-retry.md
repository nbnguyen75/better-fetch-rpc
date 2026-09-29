# Interceptors & Retry/Timeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose `@better-fetch/fetch` native retry, timeout, and interceptor/plugin options on a per-request basis.

**Architecture:** `@better-fetch/fetch` natively supports interceptors (`onRequest`, `onResponse`, `onError`, `plugins`), `retry`, and `timeout` via `BetterFetchOption`. However, the RPC client's `RequestOptions` type strictly limits per-request arguments to just `headers`, `params`, `query`, and `body`. We will extract the allowed extra options into an `ExtraRequestOptions` type, append it to `InferRequest` and `RequestOptions`, and merge these extra options dynamically inside `makeRequest` before calling the underlying `$fetchBase`.

**Tech Stack:** TypeScript, `@better-fetch/fetch`, vitest

**Spec:** Expose standard features already supported by the transport engine to the end-user without introducing new runtime dependencies.

## Global Constraints

- No new dependencies.
- Pass type-check and type-tests cleanly.

---

### Task 1: Extend RequestOptions and InferRequest Types

**Files:**

- Modify: `src/rpc.ts`
- Modify: `src/rpc.test-d.ts`

**Interfaces:**

- Produces: `ExtraRequestOptions`, an extended `RequestOptions` type, and an extended `InferRequest` type that support `timeout`, `retry`, and interceptors.

- [x] **Step 1: Write type tests**

Add type tests to `src/rpc.test-d.ts` asserting that an RPC call allows `timeout`, `retry`, and interceptors like `onRequest`.

```typescript
// in src/rpc.test-d.ts, inside a test block
const api = createRpcClient<Router>('https://api.example.com');
api.api.v1.notes.$get({
  query: { limit: 10 },
  timeout: 5000,
  retry: { type: 'linear', attempts: 3 },
  onRequest: (ctx) => {
    // some interceptor logic
  },
});
```

- [x] **Step 2: Run type tests to verify failure**

Run: `pnpm run test`
Expected: FAIL due to TS error (e.g. `Object literal may only specify known properties, and 'timeout' does not exist in type 'InferRequest...'.`)

- [x] **Step 3: Implement ExtraRequestOptions**

Modify `src/rpc.ts`:

1. Import `BetterFetchOption` from `@better-fetch/fetch`.
2. Define `ExtraRequestOptions`:

```typescript
export type ExtraRequestOptions = Omit<
  BetterFetchOption,
  'body' | 'query' | 'params' | 'headers' | 'method' | 'output' | 'errorSchema' | 'baseURL'
>;
```

3. Merge `ExtraRequestOptions` into `RequestOptions`:

```typescript
export type RequestOptions = ExtraRequestOptions & {
  headers?: Record<string, string | undefined>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
};
```

4. Update `RequestArgs` to include `ExtraRequestOptions`:

```typescript
type RequestArgs<Endpoint extends EndpointDef> =
  Record<string, never> extends InferRequest<Endpoint>
    ? [options?: InferRequest<Endpoint> & ExtraRequestOptions]
    : [options: InferRequest<Endpoint> & ExtraRequestOptions];
```

- [x] **Step 4: Run type tests to verify success**

Run: `pnpm run test`
Expected: Type errors should be resolved (though runtime behavior isn't wired up yet, the type tests will pass or runtime tests might fail if they check implementation).

- [x] **Step 5: Commit**

```bash
git add src/rpc.ts src/rpc.test-d.ts
git commit -m "feat: expose retry, timeout, and interceptor options in request types"
```

---

### Task 2: Wire up extra options to makeRequest

**Files:**

- Modify: `src/rpc.ts`
- Modify: `src/rpc.test.ts`

**Interfaces:**

- Consumes: `RequestOptions` from Task 1

- [x] **Step 1: Write runtime tests**

Add a test in `src/rpc.test.ts` using a mocked server/handler to assert that passing `timeout` or `onRequest` actually works.
For example, an `onRequest` interceptor that modifies headers, or verifying that a retry occurs.

```typescript
// in src/rpc.test.ts
import { describe, it, expect, vi } from 'vitest';
// ... set up mock server or use vi.fn() interceptor

it('passes extra request options like interceptors down to better-fetch', async () => {
  const onRequestSpy = vi.fn();
  const api = createRpcClient<Router>('https://api.example.com');

  // Assuming a mocked endpoint or similar setup exists in the file
  await api.api.v1.notes.$get({
    onRequest: onRequestSpy,
  });

  expect(onRequestSpy).toHaveBeenCalled();
});
```

- [x] **Step 2: Run tests to verify failure**

Run: `pnpm run test`
Expected: FAIL because the interceptor is not called.

- [x] **Step 3: Implement makeRequest merging**

Modify `makeRequest` inside `createRpcClient` in `src/rpc.ts`:

```typescript
const makeRequest = (method: HttpMethod, path: string, options?: RequestOptions) => {
  const responseSchema = schemaIndex?.[path]?.[METHOD_TO_KEY[method]]?.response;

  // Extract known RPC keys and keep the rest as extra options
  const { headers, params, query, body, ...extraOptions } = options || {};

  return $fetchBase(path, {
    ...extraOptions,
    headers,
    params,
    query,
    body,
    method,
    // better-fetch validates `output` natively and always throws a
    // `ValidationError` on failure — in both `throw` modes. Routes without
    // a runtime schema pass through untouched (inference-only).
    ...(isStandardSchema(responseSchema) ? { output: responseSchema } : {}),
  });
};
```

- [x] **Step 4: Run tests to verify success**

Run: `pnpm run test`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/rpc.ts src/rpc.test.ts
git commit -m "feat: forward interceptor and retry options to underlying fetch call"
```
