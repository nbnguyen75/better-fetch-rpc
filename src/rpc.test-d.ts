import type { EnsureRouter, InferRequestType, InferResponseType } from './index.js';

import * as v from 'valibot';
import { z } from 'zod';

import { createRpcClient } from './index.js';

type ApiSuccessResponse<T> = {
  timestamp: string;
  success: true;
  data: T;
};

type ApiErrorResponse = {
  errorCode: string;
  timestamp: string;
  details: unknown;
  message: string;
  success: false;
};

type Note = {
  id: string;
  title: string;
};

// Real schemas from two different Standard Schema libraries. Both must
// infer to their output type through the same `InferSchema` path.
const countSchema = z.object({ count: z.number() });
const totalSchema = v.object({ total: v.number() });
const searchQuerySchema = z.object({ q: z.string() });

type NotesFetchRouter = EnsureRouter<{
  '/api/v1/notes': {
    $get: {
      response: ApiSuccessResponse<Array<Note>>;
      query?: { limit?: number } | undefined;
    };
    $post: {
      response: ApiSuccessResponse<Note>;
      body: { title: string };
    };
  };
  '/api/v1/notes/:id': {
    $get: {
      response: ApiSuccessResponse<Note>;
      params: { id: string };
    };
  };
  '/api/v1/notes/count': {
    $get: {
      response: typeof countSchema;
    };
  };
  '/api/v1/notes/total': {
    $get: {
      response: typeof totalSchema;
    };
  };
  '/api/v1/notes/search': {
    $get: {
      response: ApiSuccessResponse<Array<Note>>;
      query: typeof searchQuerySchema;
    };
  };
}>;

const api = createRpcClient<NotesFetchRouter, ApiErrorResponse>('http://localhost:3000', {
  auth: { token: 'test-token', type: 'Bearer' },
});

const throwingApi = createRpcClient<NotesFetchRouter, ApiErrorResponse>('http://localhost:3000', {
  throw: true,
});

// Runtime schemas mirror the router: same paths, same method keys. Routes
// without an entry stay inference-only and pass through unvalidated.
const validatedApi = createRpcClient<NotesFetchRouter, ApiErrorResponse>('http://localhost:3000', {
  schemas: {
    '/api/v1/notes/count': { $get: { response: countSchema } },
    '/api/v1/notes/total': { $get: { response: totalSchema } },
  },
});

export async function exerciseClient(): Promise<void> {
  // No required fields -> options optional.
  const list = await api.api.v1.notes.$get();
  if (list.error) {
    const code: string = list.error.errorCode;
    throw new Error(code);
  }
  const first: Note | undefined = list.data.data[0];
  if (!first) throw new Error('empty');

  const withQuery = await api.api.v1.notes.$get({ query: { limit: 10 } });
  if (!withQuery.error) {
    const notes: Array<Note> = withQuery.data.data;
    if (notes.length < 0) throw new Error('impossible');
  }

  const created = await api.api.v1.notes.$post({ body: { title: 'hello' } });
  if (!created.error) {
    const title: string = created.data.data.title;
    if (title !== 'hello') throw new Error('unexpected title');
  }

  const single = await api.api.v1.notes[':id'].$get({ params: { id: '1' } });
  if (!single.error) {
    const id: string = single.data.data.id;
    if (id !== '1') throw new Error('unexpected id');
  }

  // Standard Schema libraries infer to their output type (zod here).
  const count = await api.api.v1.notes.count.$get();
  if (!count.error) {
    const total: number = count.data.count;
    if (total < 0) throw new Error('negative count');
  }

  // Same inference path through a different library (valibot here).
  const totalResult = await validatedApi.api.v1.notes.total.$get();
  if (!totalResult.error) {
    const total: number = totalResult.data.total;
    if (total < 0) throw new Error('negative total');
  }

  // Schemas also infer on the input side (query here).
  const search = await api.api.v1.notes.search.$get({ query: { q: 'hello' } });
  if (!search.error) {
    const notes: Array<Note> = search.data.data;
    if (notes.length < 0) throw new Error('impossible');
  }

  // throw: true unwraps to the response data directly.
  const unwrapped = await throwingApi.api.v1.notes[':id'].$get({ params: { id: '1' } });
  const unwrappedTitle: string = unwrapped.data.title;
  if (unwrappedTitle === '') throw new Error('empty title');
}

export type GetNotesRequest = InferRequestType<typeof api.api.v1.notes.$get>;
export type GetNotesResponse = InferResponseType<typeof api.api.v1.notes.$get>['data'];

export async function getNotesClient(args: GetNotesRequest): Promise<GetNotesResponse> {
  const result = await api.api.v1.notes.$get(args);
  if (result.error) throw new Error(result.error.errorCode);
  return result.data;
}

// @ts-expect-error - body is required for $post
export const missingBody = () => api.api.v1.notes.$post({});

// @ts-expect-error - params are required for nested routes
export const missingParams = () => api.api.v1.notes[':id'].$get();

/* oxlint-disable typescript/no-unsafe-member-access, typescript/no-unsafe-return */
// @ts-expect-error - unknown routes do not exist on the typed client
export const unknownRoute = () => api.api.v1.unknown.$get();
/* oxlint-enable typescript/no-unsafe-member-access, typescript/no-unsafe-return */

// @ts-expect-error - query must match the router definition
export const wrongQuery = () => api.api.v1.notes.$get({ query: { limit: 'ten' } });

// @ts-expect-error - schema-validated query must match the schema output
export const wrongSchemaQuery = () => api.api.v1.notes.search.$get({ query: { q: 42 } });

export const wrongSchemaPath = createRpcClient<NotesFetchRouter>('http://localhost:3000', {
  schemas: {
    // @ts-expect-error - schemas must mirror declared router paths
    '/api/v1/nope': { $get: { response: countSchema } },
  },
});
