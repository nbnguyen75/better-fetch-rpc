<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->

[![NPM Version](https://img.shields.io/npm/v/better-fetch-rpc.svg?style=for-the-badge)](https://www.npmjs.com/package/better-fetch-rpc)
[![NPM Downloads](https://img.shields.io/npm/dm/better-fetch-rpc.svg?style=for-the-badge)](https://www.npmjs.com/package/better-fetch-rpc)
[![Contributors](https://img.shields.io/github/contributors/nbnguyen75/better-fetch-rpc.svg?style=for-the-badge)](https://github.com/nbnguyen75/better-fetch-rpc/graphs/contributors)
[![Forks](https://img.shields.io/github/forks/nbnguyen75/better-fetch-rpc.svg?style=for-the-badge)](https://github.com/nbnguyen75/better-fetch-rpc/network/members)
[![Stargazers](https://img.shields.io/github/stars/nbnguyen75/better-fetch-rpc.svg?style=for-the-badge)](https://github.com/nbnguyen75/better-fetch-rpc/stargazers)
[![Issues](https://img.shields.io/github/issues/nbnguyen75/better-fetch-rpc.svg?style=for-the-badge)](https://github.com/nbnguyen75/better-fetch-rpc/issues)
[![MIT License](https://img.shields.io/github/license/nbnguyen75/better-fetch-rpc.svg?style=for-the-badge)](https://github.com/nbnguyen75/better-fetch-rpc/blob/main/LICENSE)

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h3 align="center">better-fetch-rpc</h3>

  <p align="center">
    A type-safe, RPC-style wrapper around <code>fetch</code> — call your API like a local function, with full type inference.
    <br />
    <a href="https://github.com/nbnguyen75/better-fetch-rpc"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/nbnguyen75/better-fetch-rpc/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
    <a href="https://github.com/nbnguyen75/better-fetch-rpc/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#1-define-your-routes">Define your routes</a></li>
        <li><a href="#2-create-the-client-and-call-it">Create the client and call it</a></li>
        <li><a href="#response-shapes">Response shapes</a></li>
        <li><a href="#typing-the-error-channel">Typing the error channel</a></li>
        <li><a href="#reusing-endpoint-types">Reusing endpoint types</a></li>
        <li><a href="#client-options">Client options</a></li>
        <li><a href="#schema-compatibility">Schema compatibility</a></li>
        <li><a href="#runtime-response-validation">Runtime response validation</a></li>
      </ul>
    </li>
    <li><a href="#api-reference">API Reference</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

**better-fetch-rpc** is a type-safe RPC-style wrapper around `fetch`. Instead of hand-writing URL strings, headers, and response parsing for every request, you define your API routes once and call them like local functions — with types inferred end-to-end.

Schema types (zod, valibot, arktype, …) are understood through [Standard Schema](https://standardschema.dev) and can optionally validate responses at runtime. The package itself has zero runtime dependencies besides its `@better-fetch/fetch` peer.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

- [![TypeScript][TypeScript-badge]][TypeScript-url]
- [![Node.js][Node-badge]][Node-url]
- [better-fetch](https://github.com/better-auth/better-fetch) — fetch engine with native Standard Schema validation

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

- Node.js ≥ 18

### Installation

```sh
npm install better-fetch-rpc
# or
pnpm add better-fetch-rpc
# or
yarn add better-fetch-rpc
```

`@better-fetch/fetch` is a peer dependency and is installed automatically by
npm, pnpm, and yarn. Runtime response validation needs a peer of at least
`v1.1.21` (the first version with Standard Schema `output` support). A schema
library (zod, valibot, …) is only needed if you use runtime response
validation.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage

### 1. Define your routes

A router maps paths to HTTP methods (`$get`, `$post`, `$put`, `$patch`,
`$delete`). Each endpoint declares its `headers`, `params`, `query`, `body`,
and `response` — as plain TypeScript types or as schemas from any
Standard Schema library:

```ts
import type { EnsureRouter } from 'better-fetch-rpc';

import { z } from 'zod';

const noteSchema = z.object({ id: z.string(), title: z.string() });

type Note = z.infer<typeof noteSchema>;
type ApiSuccessResponse<T> = { success: true; data: T };

type Router = EnsureRouter<{
  '/api/v1/notes': {
    $get: {
      response: ApiSuccessResponse<Note[]>;
      query?: { limit?: number } | undefined;
    };
    $post: {
      response: ApiSuccessResponse<Note>;
      body: { title: string };
    };
  };
  '/api/v1/notes/:id': {
    $get: {
      response: typeof noteSchema;
      params: { id: string };
    };
  };
}>;
```

Endpoints that declare nothing — or only optional fields — accept zero
arguments; required fields must be passed.

### 2. Create the client and call it

Path segments become properties. `:id`-style segments are indexed with the
literal key and filled from `params` (which better-fetch also substitutes
into the URL):

```ts
import { createRpcClient } from 'better-fetch-rpc';

const api = createRpcClient<Router>('https://api.example.com');

// Fully typed request + response
const { data, error } = await api.api.v1.notes[':id'].$get({
  params: { id: '123' },
});

if (error) {
  console.error(error);
} else {
  console.log(data); // typed from the route definition
}
```

### Response shapes

By default every call resolves to `{ data, error }` — exactly one of them is
non-null. Pass `throw: true` to receive the response data directly and let
transport failures reject instead:

```ts
const throwing = createRpcClient<Router>('https://api.example.com', { throw: true });

const notes = await throwing.api.v1.notes.$get({ query: { limit: 10 } });
//    ^ typed as the $get response (no envelope)
```

### Typing the error channel

Pass your server's error shape as the second generic so `error` is typed:

```ts
type ApiError = { errorCode: string; message: string };

const api = createRpcClient<Router, ApiError>('https://api.example.com');

const { error } = await api.api.v1.notes.$get();
if (error) {
  console.error(error.errorCode); // string
}
```

### Reusing endpoint types

`InferRequestType` / `InferResponseType` extract an endpoint's options and
resolved value — handy for wrapping calls in your own functions:

```ts
import type { InferRequestType, InferResponseType } from 'better-fetch-rpc';

type GetNotesRequest = InferRequestType<typeof api.api.v1.notes.$get>;
type GetNotesResponse = InferResponseType<typeof api.api.v1.notes.$get>['data'];

export async function getNotes(args: GetNotesRequest): Promise<GetNotesResponse> {
  const result = await api.api.v1.notes.$get(args);
  if (result.error) throw new Error('Request failed');
  return result.data;
}
```

### Client options

The second argument accepts everything
[`@better-fetch/fetch`](https://github.com/better-auth/better-fetch) accepts
(`auth`, `headers`, `retry`, `timeout`, …) — except `baseURL`/`body`, which
the client owns — plus `schemas` (see below):

```ts
const api = createRpcClient<Router>('https://api.example.com', {
  auth: { token: () => getToken(), type: 'Bearer' },
});
```

### Schema compatibility

Request/response types are inferred through [Standard Schema](https://standardschema.dev),
so any compliant library works — no hard dependency on a specific one:

- zod ≥ 3.24
- valibot ≥ 1.0
- arktype ≥ 2.0
- …anything exposing `~standard`

Plain TypeScript types work too — schemas are optional, not required.

### Runtime response validation

Types alone can't verify what the server actually sends. To validate responses
at runtime, define routes as a const once — feeding both the router type and
the runtime schemas — and pass it via the `schemas` option:

```ts
import { z } from 'zod';
import { ValidationError, createRpcClient } from 'better-fetch-rpc';

const noteSchema = z.object({ id: z.string(), title: z.string() });

const routes = {
  '/api/v1/notes/:id': {
    $get: { response: noteSchema },
  },
} as const;

type Router = EnsureRouter<typeof routes>;

const api = createRpcClient<Router>('https://api.example.com', { schemas: routes });

try {
  const { data, error } = await api.api.v1.notes[':id'].$get({ params: { id: '123' } });
  if (error) {
    console.error('Request failed:', error);
  } else {
    console.log(data.title); // validated: guaranteed to match noteSchema
  }
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Server broke the contract:', error.issues);
  }
  throw error;
}
```

Rules:

- Only routes with a runtime schema are validated; everything else passes
  through untouched (inference-only, zero cost).
- Validation failures **always throw** `ValidationError` (re-exported for
  convenience) — in both `throw: true` and default modes, just like network
  errors. The `{ data, error }` channel is reserved for server responses.
- Schemas declared as bare types (no runtime instance) are inference-only;
  only `typeof mySchema` entries paired with `schemas` can be validated.

_For more examples and the full API reference, please refer to the [Documentation](https://github.com/nbnguyen75/better-fetch-rpc)._

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- API REFERENCE -->

## API Reference

### Values

| Export             | Description                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `createRpcClient`  | `createRpcClient<Router, Error = unknown>(baseURL?, options?)` — builds the typed RPC client. |
| `ValidationError`  | Re-exported from `@better-fetch/fetch`. Thrown on response validation failure; has `.issues`. |
| `isStandardSchema` | Type guard for Standard Schema instances.                                                     |

### Types

| Export                  | Description                                                             |
| ----------------------- | ----------------------------------------------------------------------- |
| `EnsureRouter<T>`       | Constrains a route map to the router shape.                             |
| `BaseRouter`            | `Record<string, MethodMap>` — the base constraint for routers.          |
| `EndpointDef`           | One endpoint: `headers` / `params` / `query` / `body` / `response`.     |
| `MethodMap`             | `$get` / `$post` / `$put` / `$patch` / `$delete` endpoint map.          |
| `ProxyTree<R, T, E>`    | The client type derived from a router.                                  |
| `RpcResponse<D, E>`     | `{ data: D; error: null } \| { data: null; error: E }`.                 |
| `RpcSchemas<R>`         | Runtime schemas mirror for the `schemas` option.                        |
| `RouteSchemas`          | Per-endpoint schemas: `{ response?: StandardSchemaV1 }`.                |
| `CreateRpcClientOption` | Client options (better-fetch options + `schemas`).                      |
| `RequestOptions`        | Per-call options: `headers` / `params` / `query` / `body`.              |
| `HttpMethod`            | `'DELETE' \| 'PATCH' \| 'POST' \| 'GET' \| 'PUT'`.                      |
| `InferRequestType<F>`   | Extracts an endpoint function's options type.                           |
| `InferResponseType<F>`  | Extracts an endpoint function's resolved value type.                    |
| `StandardSchemaV1`      | Vendored Standard Schema interface (no dependency needed to reference). |
| `InferStandardInput`    | Infer a schema's input type.                                            |
| `InferStandardOutput`   | Infer a schema's output type.                                           |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->

## Roadmap

- [x] Core RPC client (GET/POST/PUT/PATCH/DELETE)
- [x] Opt-in Standard Schema runtime response validation
- [ ] Request/response interceptors
- [ ] Built-in retry & timeout handling

See the [open issues](https://github.com/nbnguyen75/better-fetch-rpc/issues) for a full list of proposed features and known issues.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

Contributions make the open source community amazing. Any contributions you make are **greatly appreciated**.

If you have a suggestion, fork the repo and open a pull request, or open an issue with the tag "enhancement". Don't forget to star the project!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

Nguyên (Wynn) - [GitHub @nbnguyen75](https://github.com/nbnguyen75)

Project Link: [https://github.com/nbnguyen75/better-fetch-rpc](https://github.com/nbnguyen75/better-fetch-rpc)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->

[TypeScript-badge]: https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Node-badge]: https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=node.js&logoColor=white
[Node-url]: https://nodejs.org/
