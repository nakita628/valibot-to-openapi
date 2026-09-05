# valibot-to-openapi

Build OpenAPI 3.0 / 3.1 / 3.2 documents from [Valibot](https://valibot.dev/) schemas. Functional port of [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi) with **no dependency besides `valibot`** — the OpenAPI object model is defined in the package itself (`src/openapi`), so `openapi3-ts` is not needed even for types.

## Install

```bash
npm install valibot-to-openapi valibot
```

## Quick Start

`valibot-to-openapi` re-exports the whole `valibot` namespace, so a single specifier covers the schemas, the `openapi` action and the generators. Metadata is attached the way Valibot's own `v.metadata` / `v.title` / `v.description` actions are:

```ts
import { OpenApiGeneratorV3, OpenAPIRegistry } from 'valibot-to-openapi'
import * as v from 'valibot-to-openapi'

const registry = new OpenAPIRegistry()

const UserIdSchema = registry.registerParameter(
  'UserId',
  v.pipe(
    v.string(),
    v.openapi({
      param: {
        name: 'id',
        in: 'path',
      },
      example: '1212121',
    }),
  ),
)

const UserSchema = v.pipe(
  v.object({
    id: v.pipe(
      v.string(),
      v.openapi({
        example: '1212121',
      }),
    ),
    name: v.pipe(
      v.string(),
      v.openapi({
        example: 'John Doe',
      }),
    ),
    age: v.pipe(
      v.number(),
      v.openapi({
        example: 42,
      }),
    ),
  }),
  v.openapi('User'),
)

const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

registry.registerPath({
  method: 'get',
  path: '/users/{id}',
  description: 'Get user data by its id',
  summary: 'Get a single user',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: v.object({ id: UserIdSchema }),
  },
  responses: {
    200: {
      description: 'Object with user data.',
      content: {
        'application/json': {
          schema: UserSchema,
        },
      },
    },
    204: {
      description: 'No content - successful operation',
    },
  },
})

const document = new OpenApiGeneratorV3(registry.definitions).generateDocument({
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'My API',
    description: 'This is the API',
  },
  servers: [{ url: 'v1' }],
})
```

This is zod-to-openapi's README example with `v.pipe(..., v.openapi(…))` in place of `.openapi(…)`; `OpenApiGeneratorV31` / `OpenApiGeneratorV32` produce the 3.1 / 3.2 flavours. The functional forms do the same without classes:

```ts
import { createRegistry, generateDocument } from 'valibot-to-openapi'
import * as v from 'valibot-to-openapi'

const registry = createRegistry()
const User = registry.register('User', v.object({ name: v.pipe(v.string(), v.minLength(1)) }))

registry.registerPath({
  method: 'get',
  path: '/users',
  responses: {
    200: { description: 'Users', content: { 'application/json': { schema: v.array(User) } } },
  },
})

// Generation returns `{ ok: true, value } | { ok: false, error }` — nothing is thrown
const document = generateDocument(registry.definitions, {
  openapi: '3.1.0',
  info: { title: 'My API', version: '1.0.0' },
})
if (document.ok) {
  console.log(document.value) // the OpenAPI document
} else {
  console.error(document.error.message) // { type, message, data } — plain object, no class
}
```

## API

| Export                                                                                            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v.openapi(metadata, options?)` / `v.openapi(refId, metadata?, options?)`                         | Metadata action for `v.pipe`, also exported as `openapi`. `refId` registers the schema under `components.schemas`. `metadata` accepts SchemaObject keywords (`description`, `example`, `type`, `deprecated`, …) plus `param` (ParameterObject props). `options.unionPreferredType` selects `oneOf` / `anyOf` for that union.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `new OpenAPIRegistry(parents?)` / `new OpenApiGeneratorV3(definitions, options?)` / `V31` / `V32` | Class forms of `createRegistry` / `generateDocument` / `generateComponents` with the zod-to-openapi signatures. Instances and `createRegistry()` results share the `Registry` type and can be mixed as parents.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `createRegistry(parents?)`                                                                        | Returns `{ definitions, register, registerParameter, registerPath, registerWebhook, registerComponent }`. `register` / `registerParameter` return the schema wrapped with the `refId` and stay usable with `v.parse`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `generateDocument(definitions, config, options?)`                                                 | Full document as `{ ok: true, value }                                                                                                                                                                                                                                                                                                \| { ok: false, error }`; the version is taken from `config.openapi` (`3.0.x`→`nullable: true`, `3.1.x`/`3.2.0`→`type: [..., 'null']`+`webhooks`). Returns the package's own `OpenAPI`type (a 3.0 / 3.1 / 3.2 superset, modelled after hono-takibi's`src/openapi`: `OpenAPI`/`Components`/`PathItem`/`Operation`/`Parameter`/`Schema`/`Reference`, all `readonly`, `$ref`typed as`#/components/<kind>/<name>`). |
| `generateComponents(definitions, config, options?)`                                               | Only `components`; `config.openapi` selects the version like `generateDocument`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `getOpenApiMetadata(schema)` / `getRefId(schema)`                                                 | Read the collected metadata of a schema.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `ValibotToOpenAPIError`                                                                           | Everything that can fail returns `{ ok: true, value }` or `{ ok: false, error }` inline — nothing is thrown and there is no named Result type. Errors are plain objects discriminated by `type` (`ConflictError`, `MissingParameterDataError`, `UnknownSchemaTypeError`, `ValibotToOpenAPIError`) with the next action in `message`.                                                                                                                                                                                                                                                                                                                                                                                                                 |

`options` for the generators: `{ unionPreferredType?: 'oneOf' | 'anyOf', sortComponents?: 'alphabetically' }`.

Metadata is collected through nested `v.pipe` calls and through `v.optional` / `v.nullable` / … wrappers; Valibot's `v.title`, `v.description`, `v.examples` and `v.metadata` actions are honoured too.

### About the single entry

The package has one entry point: `export * from 'valibot'` plus its own exports. It is side-effect free and tree-shakeable, so `import * as v from 'valibot-to-openapi'` costs no more than importing `valibot` separately (`import * as v from 'valibot'` + `import { openapi } from 'valibot-to-openapi'` keeps working). No name collides — `valibot` exports nothing this package also exports. Valibot schemas are plain objects composed through `v.pipe` and carry no methods, so there is deliberately no `.openapi()` method: a Zod-style `extendZodWithOpenApi(z)` has no counterpart (ESM namespaces are frozen and there is no shared prototype to patch).

### Tips

- **Extending objects** (zod's `.extend()`): `v.intersect([Base, v.object({ extra: v.string() })])` emits `allOf: [{ $ref: '#/components/schemas/Base' }, { … }]` when `Base` is registered.
- **`v.openapi()` infers its input type from the surrounding `v.pipe`.** Defined on its own (`const meta = v.openapi({ default: 1 })`) it falls back to `unknown`, so `default` / `example` are only type-checked inside the pipe.
- `OpenAPIObjectConfigV30` / `V31` / `V32` narrow `config.openapi` to the version literals when you want the compiler to pin the version.