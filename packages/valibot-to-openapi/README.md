# valibot-to-openapi

Build OpenAPI 3.0 / 3.1 / 3.2 documents from [Valibot](https://valibot.dev/) schemas. Functional port of [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi) with **no dependency besides `valibot`** — the OpenAPI object model is defined in the package itself (`src/openapi`), so `openapi3-ts` is not needed even for types.

## Install

```bash
npm install valibot-to-openapi valibot
```

## Quick Start

```ts
import * as v from 'valibot'
import { createRegistry, generateDocument, openapi } from 'valibot-to-openapi'

const registry = createRegistry()

const User = registry.register(
  'User',
  v.object({
    id: v.pipe(v.string(), v.uuid(), openapi({ description: 'The user id' })),
    name: v.pipe(v.string(), v.minLength(1)),
    age: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 18),
  }),
)

const UserId = registry.registerParameter(
  'UserId',
  v.pipe(v.string(), v.uuid(), openapi({ param: { name: 'id', in: 'path' } })),
)

registry.registerPath({
  method: 'get',
  path: '/users/{id}',
  summary: 'Get a single user',
  request: { params: v.object({ id: UserId }) },
  responses: {
    200: {
      description: 'The user',
      content: { 'application/json': { schema: User } },
    },
    404: { description: 'Not found' },
  },
})

const document = generateDocument(registry.definitions, {
  openapi: '3.1.0',
  info: { title: 'My API', version: '1.0.0' },
})
```

## API

| Export                                                                                          | Description                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openapi(metadata, options?)` / `openapi(refId, metadata?, options?)`                           | Metadata action for `v.pipe`. `refId` registers the schema under `components.schemas`. `metadata` accepts SchemaObject keywords (`description`, `example`, `type`, `deprecated`, …) plus `param` (ParameterObject props). `options.unionPreferredType` selects `oneOf` / `anyOf` for that union.                                                                                                                             |
| `createRegistry(parents?)`                                                                      | Returns `{ definitions, register, registerParameter, registerPath, registerWebhook, registerComponent }`. `register` / `registerParameter` return the schema wrapped with the `refId` and stay usable with `v.parse`.                                                                                                                                                                                                        |
| `generateDocument(definitions, config, options?)`                                               | Full document; the version is taken from `config.openapi` (`3.0.x` → `nullable: true`, `3.1.x` / `3.2.0` → `type: [..., 'null']` + `webhooks`). Returns the package's own `OpenAPI` type (a 3.0 / 3.1 / 3.2 superset, modelled after hono-takibi's `src/openapi`: `OpenAPI` / `Components` / `PathItem` / `Operation` / `Parameter` / `Schema` / `Reference`, all `readonly`, `$ref` typed as `#/components/<kind>/<name>`). |
| `generateComponents(definitions, config, options?)`                                             | Only `components`; `config.openapi` selects the version like `generateDocument`.                                                                                                                                                                                                                                                                                                                                             |
| `getOpenApiMetadata(schema)` / `getRefId(schema)`                                               | Read the collected metadata of a schema.                                                                                                                                                                                                                                                                                                                                                                                     |
| `ConflictError`, `MissingParameterDataError`, `UnknownSchemaTypeError`, `ValibotToOpenAPIError` | Thrown for conflicting parameter `name` / `in`, parameters without `name` / `in`, unsupported schema types and mixed enums.                                                                                                                                                                                                                                                                                                  |

`options` for the generators: `{ unionPreferredType?: 'oneOf' | 'anyOf', sortComponents?: 'alphabetically' }`.

Metadata is collected through nested `v.pipe` calls and through `v.optional` / `v.nullable` / … wrappers; Valibot's `v.title`, `v.description`, `v.examples` and `v.metadata` actions are honoured too.

### Tips

- **Extending objects** (zod's `.extend()`): `v.intersect([Base, v.object({ extra: v.string() })])` emits `allOf: [{ $ref: '#/components/schemas/Base' }, { … }]` when `Base` is registered.
- **`openapi()` infers its input type from the surrounding `v.pipe`.** Defined on its own (`const meta = openapi({ default: 1 })`) it falls back to `unknown`, so `default` / `example` are only type-checked inside the pipe.
- `OpenAPIObjectConfigV30` / `V31` / `V32` narrow `config.openapi` to the version literals when you want the compiler to pin the version.

## Links

- [Repository](https://github.com/nakita628/valibot-to-openapi)
- [Valibot](https://valibot.dev/)
- [OpenAPI 3.2.0](https://spec.openapis.org/oas/v3.2.0.html)
