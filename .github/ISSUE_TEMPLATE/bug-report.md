---
name: Bug report
about: A schema produces the wrong OpenAPI output, or generation fails
title: 'fix: '
labels: ['bug']
---

## What

<!-- What happens, and what should happen instead. -->

## Where

<!-- `valibot-to-openapi` version, `valibot` version, OpenAPI version (3.0 / 3.1 / 3.2), Node.js version. -->

## How

<!-- The smallest schema that reproduces it, and the output. -->

```ts
import * as v from 'valibot-to-openapi'

const Schema = v.pipe(v.string(), v.openapi({ example: 'x' }))
```

```yaml
# the document produced, or the error
```
