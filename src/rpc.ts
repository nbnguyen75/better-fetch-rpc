import type { CreateFetchOption } from '@better-fetch/fetch';
import type { InferStandardOutput, StandardSchemaV1 } from './standard-schema.js';

import { createFetch } from '@better-fetch/fetch';

import { isStandardSchema } from './standard-schema.js';

type InferSchema<T> = T extends StandardSchemaV1 ? InferStandardOutput<T> : T;

export type EndpointDef = {
  headers?: Record<string, string | undefined> | StandardSchemaV1;
  query?: Record<string, unknown> | StandardSchemaV1 | undefined;
  params?: Record<string, unknown> | StandardSchemaV1;
  response?: unknown;
  body?: unknown;
};

export type MethodMap = {
  $delete?: EndpointDef;
  $patch?: EndpointDef;
  $post?: EndpointDef;
  $get?: EndpointDef;
  $put?: EndpointDef;
};

type InferRequest<T extends EndpointDef> = {
  [
    K in keyof T as K extends 'body' | 'headers' | 'params' | 'query'
      ? T[K] extends never
        ? never
        : K
      : never
  ]: InferSchema<T[K]>;
};

type RequestArgs<Endpoint extends EndpointDef> =
  Record<string, never> extends InferRequest<Endpoint>
    ? [options?: InferRequest<Endpoint>]
    : [options: InferRequest<Endpoint>];

export type RequestOptions = {
  headers?: Record<string, string | undefined>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
};

type Split<S extends string> = S extends `${infer Head}/${infer Tail}`
  ? Head extends ''
    ? Split<Tail>
    : [Head, ...Split<Tail>]
  : S extends ''
    ? []
    : [S];

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

export type RpcResponse<Data, Error = unknown> =
  | { error: Error; data: null }
  | { error: null; data: Data };

type MethodClient<Methods extends MethodMap, Throw extends boolean, Error = unknown> = {
  [M in keyof Methods as Methods[M] extends EndpointDef ? M : never]: Methods[M] extends EndpointDef
    ? (
        ...args: RequestArgs<Methods[M]>
      ) => Promise<
        Throw extends true
          ? InferResponse<Methods[M]>
          : RpcResponse<InferResponse<Methods[M]>, Error>
      >
    : never;
};

type BuildBranch<Segments extends ReadonlyArray<string>, Leaf> = Segments extends readonly [
  infer Head extends string,
  ...infer Rest extends ReadonlyArray<string>,
]
  ? Rest extends readonly []
    ? { [K in Head]: Leaf }
    : { [K in Head]: BuildBranch<Rest, Leaf> }
  : never;

export type BaseRouter = Record<string, MethodMap>;

export type ProxyTree<
  Router extends BaseRouter,
  Throw extends boolean = false,
  Error = unknown,
> = UnionToIntersection<
  {
    [Path in keyof Router]: Path extends string
      ? BuildBranch<Split<Path>, MethodClient<Router[Path], Throw, Error>>
      : never;
  }[keyof Router]
>;

export type HttpMethod = 'DELETE' | 'PATCH' | 'POST' | 'GET' | 'PUT';

const METHOD_KEY_MAP: Record<string, HttpMethod> = {
  $delete: 'DELETE',
  $patch: 'PATCH',
  $post: 'POST',
  $get: 'GET',
  $put: 'PUT',
};

const METHOD_TO_KEY: Record<HttpMethod, '$delete' | '$get' | '$patch' | '$post' | '$put'> = {
  DELETE: '$delete',
  GET: '$get',
  PATCH: '$patch',
  POST: '$post',
  PUT: '$put',
};

export type InferRequestType<T extends (...args: Array<never>) => unknown> = Parameters<T>[0];

export type InferResponseType<T extends (...args: Array<never>) => unknown> = Awaited<
  ReturnType<T>
>;

type InferResponse<T extends EndpointDef> = InferSchema<T['response']>;

export type EnsureRouter<T extends BaseRouter> = T;

export type RouteSchemas = {
  response?: StandardSchemaV1 | undefined;
};

export type RpcSchemas<Router extends BaseRouter> = {
  [Path in keyof Router]?: {
    [Method in keyof Router[Path]]?: RouteSchemas | undefined;
  };
};

export type CreateRpcClientOption<Router extends BaseRouter = BaseRouter> = Omit<
  CreateFetchOption,
  'baseURL' | 'body'
> & {
  schemas?: RpcSchemas<Router> | undefined;
};

function createProxyClient(
  makeRequest: (method: HttpMethod, path: string, options?: RequestOptions) => unknown,
  segments: Array<string> = [],
) {
  return new Proxy(() => {}, {
    get(_target, prop: string) {
      if (prop in METHOD_KEY_MAP) {
        const method = METHOD_KEY_MAP[prop];
        if (!method) return undefined;
        const path = '/' + segments.join('/');
        return (options?: RequestOptions) => makeRequest(method, path, options);
      }
      return createProxyClient(makeRequest, [...segments, prop]);
    },
  });
}

export function createRpcClient<Router extends BaseRouter, Error = unknown>(
  baseURL: undefined | string,
  option: CreateRpcClientOption<Router> & { throw: true },
): ProxyTree<Router, true, Error>;

export function createRpcClient<Router extends BaseRouter, Error = unknown>(
  baseURL?: string,
  option?: CreateRpcClientOption<Router>,
): ProxyTree<Router, false, Error>;

export function createRpcClient<Router extends BaseRouter, Error = unknown>(
  baseURL?: string,
  option: CreateRpcClientOption<Router> = {},
): ProxyTree<Router, boolean, Error> {
  const { schemas, ...fetchOption } = option;
  const $fetchBase = createFetch({
    ...(baseURL ? { baseURL } : {}),
    ...fetchOption,
  });

  // Widened for lookup: `schemas` is keyed by the router's literal paths,
  // but `path` is only known as `string` at runtime.
  const schemaIndex:
    | Record<string, Record<string, RouteSchemas | undefined> | undefined>
    | undefined = schemas;

  const makeRequest = (method: HttpMethod, path: string, options?: RequestOptions) => {
    const responseSchema = schemaIndex?.[path]?.[METHOD_TO_KEY[method]]?.response;
    return $fetchBase(path, {
      headers: options?.headers,
      params: options?.params,
      query: options?.query,
      body: options?.body,
      method,
      // better-fetch validates `output` natively and always throws a
      // `ValidationError` on failure — in both `throw` modes. Routes without
      // a runtime schema pass through untouched (inference-only).
      ...(isStandardSchema(responseSchema) ? { output: responseSchema } : {}),
    });
  };

  // The proxy client is intentionally untyped at construction; it is cast to
  // the caller-facing `ProxyTree` type on this boundary.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return createProxyClient(makeRequest) as ProxyTree<Router, boolean, Error>;
}
