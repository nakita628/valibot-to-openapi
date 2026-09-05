import { describe, expect, it } from 'vite-plus/test'

import * as v from '../index.js'
import {
  createRegistry,
  generateComponents,
  generateDocument,
  OpenApiGeneratorV3,
  OpenApiGeneratorV31,
  OpenApiGeneratorV32,
  OpenAPIRegistry,
} from './index.js'

describe('class API', () => {
  const route = {
    method: 'get',
    path: '/',
    responses: { 200: { description: 'OK' } },
  } as const

  it('OpenAPIRegistry matches createRegistry() and accepts its results as parents', () => {
    const parent = createRegistry()
    const Base = parent.register('Base', v.string())
    const registry = new OpenAPIRegistry([parent])
    const User = registry.register('User', v.object({ base: Base }))
    const Id = registry.registerParameter('Id', v.string())
    registry.registerPath(route)
    registry.registerWebhook(route)
    const component = registry.registerComponent('responses', 'NotFound', { description: 'x' })
    expect(component).toStrictEqual({
      name: 'NotFound',
      ref: { $ref: '#/components/responses/NotFound' },
    })
    expect(registry.definitions).toStrictEqual([
      { type: 'schema', schema: Base },
      { type: 'schema', schema: User },
      { type: 'parameter', schema: Id },
      { type: 'route', route },
      { type: 'webhook', webhook: route },
      {
        type: 'component',
        componentType: 'responses',
        name: 'NotFound',
        component: { description: 'x' },
      },
    ])
  })

  it('OpenApiGeneratorV3 matches the functions', () => {
    const registry = new OpenAPIRegistry()
    registry.register('User', v.object({ name: v.nullable(v.string()) }))
    registry.registerPath(route)
    registry.registerWebhook(route)
    const info = { title: 'T', version: '1' }
    const options = { sortComponents: 'alphabetically' } as const
    const generator = new OpenApiGeneratorV3(registry.definitions, options)
    expect(generator.generateDocument({ openapi: '3.0.0', info })).toStrictEqual(
      generateDocument(registry.definitions, { openapi: '3.0.0', info }, options),
    )
    expect(generator.generateComponents()).toStrictEqual(
      generateComponents(registry.definitions, { openapi: '3.0.0' }, options),
    )
  })

  it('OpenApiGeneratorV31 matches the functions', () => {
    const registry = new OpenAPIRegistry()
    registry.register('User', v.object({ name: v.nullable(v.string()) }))
    registry.registerPath(route)
    registry.registerWebhook(route)
    const info = { title: 'T', version: '1' }
    const options = { sortComponents: 'alphabetically' } as const
    const generator = new OpenApiGeneratorV31(registry.definitions, options)
    expect(generator.generateDocument({ openapi: '3.1.0', info })).toStrictEqual(
      generateDocument(registry.definitions, { openapi: '3.1.0', info }, options),
    )
    expect(generator.generateComponents()).toStrictEqual(
      generateComponents(registry.definitions, { openapi: '3.1.0' }, options),
    )
  })

  it('OpenApiGeneratorV32 matches the functions', () => {
    const registry = new OpenAPIRegistry()
    registry.register('User', v.object({ name: v.nullable(v.string()) }))
    registry.registerPath(route)
    registry.registerWebhook(route)
    const info = { title: 'T', version: '1' }
    const options = { sortComponents: 'alphabetically' } as const
    const generator = new OpenApiGeneratorV32(registry.definitions, options)
    expect(generator.generateDocument({ openapi: '3.2.0', info })).toStrictEqual(
      generateDocument(registry.definitions, { openapi: '3.2.0', info }, options),
    )
    expect(generator.generateComponents()).toStrictEqual(
      generateComponents(registry.definitions, { openapi: '3.2.0' }, options),
    )
  })
})
