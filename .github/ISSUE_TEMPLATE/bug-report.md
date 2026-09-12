---
name: Bug report
about: A schema produces the wrong OpenAPI output, or generation fails
title: 'fix: '
labels: ['bug']
---

## Why

<!-- What is wrong, and why it matters. -->

## What

<!-- What happens, and what should happen instead. -->

## Where

<!-- `valibot-to-openapi` version, `valibot` version, OpenAPI version (3.0 / 3.1 / 3.2). -->

## Who

<!-- Who sees it: every user, one OpenAPI version, a specific schema. -->

## When

<!-- When it started, or `unknown`. -->

## How

<!-- The smallest schema that reproduces it, and the output. -->

```ts
import * as v from 'valibot-to-openapi'

const Schema = v.pipe(v.string(), v.openapi({ example: 'x' }))
```

```yaml
# the document produced, or the error
```
