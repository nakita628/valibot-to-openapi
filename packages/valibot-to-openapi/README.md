# valibot-to-openapi

A library that generates OpenAPI docs from [Valibot](https://valibot.dev/) schemas

## Install

```bash
npm install valibot-to-openapi valibot
```

## Usage

```ts
import { createRegistry, generateDocument } from 'valibot-to-openapi'
import * as v from 'valibot-to-openapi'

const registry = createRegistry()

const User = registry.register(
  'User',
  v.object({
    id: v.pipe(v.string(), v.openapi({ example: '1212121' })),
    name: v.pipe(v.string(), v.openapi({ example: 'John Doe' })),
  }),
)

registry.registerPath({
  method: 'get',
  path: '/users',
  responses: {
    200: {
      description: 'Users',
      content: { 'application/json': { schema: v.array(User) } },
    },
  },
})

const result = generateDocument(registry.definitions, {
  openapi: '3.1.0',
  info: { title: 'My API', version: '1.0.0' },
})

if (result.ok) {
  console.log(result.value)
} else {
  console.error(result.error.message)
}
```

## License

Distributed under the MIT License. See [LICENSE](https://github.com/nakita628/valibot-to-openapi?tab=MIT-1-ov-file) for more information.
