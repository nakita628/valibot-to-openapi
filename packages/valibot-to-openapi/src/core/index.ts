import type { GenericSchema, InferOutput, SchemaWithPipe } from 'valibot'
import { pipe } from 'valibot'

import { generateDocumentData } from '../helper/index.js'
import { getOpenApiMetadata, openapi } from '../metadata/index.js'
import type { OpenapiAction } from '../metadata/index.js'
import { specificsFor } from '../specifics/index.js'
import type {
  ComponentTypeKey,
  ComponentTypeOf,
  Definition,
  GenerationContext,
  GeneratorOptions,
  OpenAPIDefinition,
  OpenAPIObject,
  RouteConfig,
  VersionSpecifics,
} from '../types/index.js'
import { componentRef } from '../utils/index.js'

export type OpenAPIObjectConfig = Omit<OpenAPIObject, 'paths' | 'components' | 'webhooks'>
export type OpenAPIObjectConfigV30 = OpenAPIObjectConfig & {
  readonly openapi: '3.0.0' | '3.0.1' | '3.0.2' | '3.0.3' | '3.0.4'
}
export type OpenAPIObjectConfigV31 = OpenAPIObjectConfig & {
  readonly openapi: '3.1.0' | '3.1.1'
}
export type OpenAPIObjectConfigV32 = OpenAPIObjectConfig & {
  readonly openapi: '3.2.0'
}

function createContext(
  specifics: VersionSpecifics,
  options: GeneratorOptions | undefined,
): GenerationContext {
  return {
    specifics,
    options,
    schemaRefs: new Map(),
    paramRefs: new Map(),
    pathRefs: new Map(),
    webhookRefs: new Map(),
    rawComponents: [],
  }
}

function isWebhook(definition: Definition) {
  return 'type' in definition && definition.type === 'webhook'
}

/**
 * Generates a full OpenAPI document. The OpenAPI version is taken from `config.openapi`:
 * 3.0.x emits `nullable: true`, 3.1+ emits `type: [..., 'null']` and `webhooks`.
 *
 * @example
 * const registry = createRegistry()
 * registry.register('User', v.object({ name: v.string() }))
 * generateDocument(registry.definitions, { openapi: '3.1.0', info: { title: 'API', version: '1.0.0' } })
 */
export function generateDocument(
  definitions: readonly Definition[],
  config: OpenAPIObjectConfig,
  options?: GeneratorOptions,
): OpenAPIObject {
  const isV30 = config.openapi.startsWith('3.0')
  const ctx = createContext(specificsFor(config.openapi), options)
  const { components, paths, webhooks } = generateDocumentData(
    ctx,
    isV30 ? definitions.filter((definition) => !isWebhook(definition)) : definitions,
  )
  return {
    ...config,
    components,
    paths,
    ...(isV30 ? {} : { webhooks }),
  }
}

/**
 * Generates only `components` (schemas, parameters and raw components). Like
 * `generateDocument`, the OpenAPI version is taken from `config.openapi`.
 *
 * @example
 * generateComponents([UserSchema], { openapi: '3.1.0' })
 */
export function generateComponents(
  definitions: readonly Definition[],
  config: Pick<OpenAPIObjectConfig, 'openapi'>,
  options?: GeneratorOptions,
): Pick<OpenAPIObject, 'components'> {
  const ctx = createContext(specificsFor(config.openapi), options)
  return { components: generateDocumentData(ctx, definitions).components }
}

export type OpenAPIRegistry = {
  /** Own definitions preceded by the definitions of every parent registry. */
  readonly definitions: readonly OpenAPIDefinition[]
  /** Registers a component schema under `/components/schemas/${refId}`. */
  readonly register: <T extends GenericSchema>(
    refId: string,
    schema: T,
  ) => SchemaWithPipe<readonly [T, OpenapiAction<InferOutput<T>>]>
  /** Registers a parameter under `/components/parameters/${refId}`. */
  readonly registerParameter: <T extends GenericSchema>(
    refId: string,
    schema: T,
  ) => SchemaWithPipe<readonly [T, OpenapiAction<InferOutput<T>>]>
  /** Registers a route generated under `paths`. */
  readonly registerPath: (route: RouteConfig) => void
  /** Registers a webhook generated under `webhooks` (OpenAPI 3.1+). */
  readonly registerWebhook: (webhook: RouteConfig) => void
  /** Registers a raw OpenAPI component object. */
  readonly registerComponent: <K extends ComponentTypeKey>(
    type: K,
    name: string,
    component: ComponentTypeOf<K>,
  ) => { readonly name: string; readonly ref: { readonly $ref: string } }
}

/**
 * Creates a registry that collects schemas, parameters, routes, webhooks and raw components.
 *
 * @example
 * const registry = createRegistry()
 * const User = registry.register('User', v.object({ name: v.string() }))
 * registry.registerPath({ method: 'get', path: '/users', responses: { 200: { description: 'OK', content: { 'application/json': { schema: v.array(User) } } } } })
 */
export function createRegistry(parents?: readonly OpenAPIRegistry[]): OpenAPIRegistry {
  const own: OpenAPIDefinition[] = []
  return {
    get definitions() {
      return [...(parents?.flatMap((parent) => parent.definitions) ?? []), ...own]
    },
    register: (refId, schema) => {
      const schemaWithRefId = pipe(schema, openapi(refId))
      own.push({ type: 'schema', schema: schemaWithRefId })
      return schemaWithRefId
    },
    registerParameter: (refId, schema) => {
      const currentName = getOpenApiMetadata(schema).param?.name
      const schemaWithMetadata = pipe(
        schema,
        openapi(refId, { param: { name: currentName ?? refId } }),
      )
      own.push({ type: 'parameter', schema: schemaWithMetadata })
      return schemaWithMetadata
    },
    registerPath: (route) => {
      own.push({ type: 'route', route })
    },
    registerWebhook: (webhook) => {
      own.push({ type: 'webhook', webhook })
    },
    registerComponent: (type, name, component) => {
      own.push({ type: 'component', componentType: type, name, component })
      return { name, ref: { $ref: componentRef(type, name) } }
    },
  }
}
