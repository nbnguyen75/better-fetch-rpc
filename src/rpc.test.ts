import type { EnsureRouter } from './index.js';

import http from 'node:http';

import * as v from 'valibot';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ValidationError } from '@better-fetch/fetch';

import { createRpcClient } from './index.js';

const userSchema = z.object({ id: z.string(), name: z.string() });
const statsSchema = v.object({ total: v.number() });

// Single source of truth: the same const feeds the router type
// (`typeof routes`) and the runtime schemas passed to the client.
const routes = {
  '/api/v1/users/:id': {
    $get: { response: userSchema },
  },
  '/api/v1/stats': {
    $get: { response: statsSchema },
  },
} as const;

type Router = EnsureRouter<typeof routes>;

let baseURL = '';
let server: http.Server;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    if (req.url === '/api/v1/users/broken') {
      // Wrong shape on purpose: id is not a string, name is missing.
      res.end(JSON.stringify({ id: 42 }));
    } else if (req.url === '/api/v1/stats') {
      res.end(JSON.stringify({ total: 'lots' }));
    } else {
      res.end(JSON.stringify({ id: '1', name: 'Ada' }));
    }
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });
  const address = server.address();
  if (typeof address !== 'object' || address === null) {
    throw new Error('Test server did not bind to a network address');
  }
  baseURL = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});

describe('runtime response validation', () => {
  it('returns validated data when the payload matches (zod)', async () => {
    const api = createRpcClient<Router>(baseURL, { schemas: routes });
    const result = await api.api.v1.users[':id'].$get({ params: { id: '1' } });
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ id: '1', name: 'Ada' });
  });

  it('always throws ValidationError on mismatch, even without throw: true (zod)', async () => {
    const api = createRpcClient<Router>(baseURL, { schemas: routes });
    await expect(api.api.v1.users[':id'].$get({ params: { id: 'broken' } })).rejects.toThrow(
      ValidationError,
    );
  });

  it('throws ValidationError with throw: true (zod)', async () => {
    const api = createRpcClient<Router>(baseURL, { schemas: routes, throw: true });
    await expect(api.api.v1.users[':id'].$get({ params: { id: 'broken' } })).rejects.toThrow(
      ValidationError,
    );
    const user = await api.api.v1.users[':id'].$get({ params: { id: '1' } });
    expect(user).toEqual({ id: '1', name: 'Ada' });
  });

  it('validates through a different Standard Schema library (valibot)', async () => {
    const api = createRpcClient<Router>(baseURL, { schemas: routes });
    await expect(api.api.v1.stats.$get()).rejects.toThrow(ValidationError);
  });

  it('passes responses through untouched without runtime schemas', async () => {
    const api = createRpcClient<Router>(baseURL);
    const result = await api.api.v1.users[':id'].$get({ params: { id: 'broken' } });
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ id: 42 });
  });

  it('exposes validation issues on the thrown error', async () => {
    const api = createRpcClient<Router>(baseURL, { schemas: routes });
    const failure = await api.api.v1.stats.$get().then(
      () => null,
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(ValidationError);
    if (failure instanceof ValidationError) {
      expect(failure.issues.length).toBeGreaterThan(0);
    } else {
      throw new Error('Expected a ValidationError');
    }
  });
});
