import { describe, expect, it } from 'vite-plus/test'

import * as v from '../index.js'
import { OpenAPIRegistry } from './index.js'

describe('OpenAPIRegistry', () => {
  const route = {
    method: 'get',
    path: '/',
    responses: { 200: { description: 'OK' } },
  } as const

  it('collects every definition kind and inherits the parents', () => {
    const parent = OpenAPIRegistry()
    const Base = parent.register('Base', v.string())
    const registry = OpenAPIRegistry([parent])
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
})
