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
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

**better-fetch-rpc** is a type-safe RPC-style wrapper around `fetch`. Instead of hand-writing URL strings, headers, and response parsing for every request, you define your API routes once and call them like local functions — with types inferred end-to-end.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

- [![TypeScript][TypeScript-badge]][TypeScript-url]
- [![Node.js][Node-badge]][Node-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm

```sh
  npm install npm@latest -g
```

### Installation

1. Install the package

```sh
   npm install better-fetch-rpc
```

2. Or with your package manager of choice

```sh
   pnpm add better-fetch-rpc
   # or
   yarn add better-fetch-rpc
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage

Define your routes once, then call them like local functions:

```ts
import type { EnsureRouter } from 'better-fetch-rpc';

import { z } from 'zod';
import { createRpcClient } from 'better-fetch-rpc';

const userSchema = z.object({ id: z.string(), name: z.string() });

type Router = EnsureRouter<{
  '/api/v1/users/:id': {
    $get: {
      response: typeof userSchema;
      params: { id: string };
    };
  };
}>;

const api = createRpcClient<Router>('https://api.example.com');

// Fully typed request + response
const { data, error } = await api.api.v1.users[':id'].$get({
  params: { id: '123' },
});

if (error) {
  console.error(error);
} else {
  console.log(data.name); // string
}
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
import { ValidationError, createRpcClient } from 'better-fetch-rpc';

const routes = {
  '/api/v1/users/:id': {
    $get: { response: userSchema },
  },
} as const;

type Router = EnsureRouter<typeof routes>;

const api = createRpcClient<Router>('https://api.example.com', { schemas: routes });

try {
  const { data, error } = await api.api.v1.users[':id'].$get({ params: { id: '123' } });
  if (error) {
    console.error('Request failed:', error);
  } else {
    console.log(data.name); // validated: guaranteed to match userSchema
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
