// The `valibot` namespace is re-exported here, so `import * as v from 'valibot-to-openapi'`
// gives `v.string()` / `v.pipe()` next to `v.openapi()` — metadata is attached the way
// Valibot's own `v.metadata` / `v.title` / `v.description` are.
// oxlint-disable-next-line import/export -- the resolver reads valibot's `require` condition, a CJS bundle with no static named exports; the `import` condition this build uses has 311 of them.
export * from 'valibot'
export {
  createRegistry,
  generateComponents,
  generateDocument,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  OpenApiGeneratorV31,
  OpenApiGeneratorV32,
} from './core/index.js'
export type {
  OpenAPIObjectConfig,
  OpenAPIObjectConfigV30,
  OpenAPIObjectConfigV31,
  OpenAPIObjectConfigV32,
  Registry,
} from './core/index.js'
export {
  conflictError,
  enhanceMissingParametersError,
  missingParameterDataError,
  unknownSchemaTypeError,
  valibotToOpenAPIError,
} from './errors/index.js'
export type { ValibotToOpenAPIError } from './errors/index.js'
export { getOpenApiMetadata, getRefId, openapi } from './metadata/index.js'
export type { OpenapiAction } from './metadata/index.js'
export type {
  ComponentTypeKey,
  ComponentTypeOf,
  ContentConfig,
  Definition,
  FullMetadata,
  GeneratorOptions,
  MediaType,
  MediaTypeConfig,
  Method,
  OpenAPIComponentObject,
  OpenAPIDefinition,
  OpenAPIMetadata,
  OpenApiOptions,
  OpenApiVersion,
  ParameterLocation,
  ParameterMetadata,
  RequestBodyConfig,
  ResponseConfig,
  RouteConfig,
  RouteParameter,
  SchemaMetadata,
  UnionPreferredType,
  WebhookDefinition,
} from './types/index.js'
export type {
  Callbacks,
  Components,
  Content,
  Discriminator,
  Encoding,
  Example,
  Examples,
  ExternalDocs,
  Format,
  Header,
  Info,
  Link,
  Media,
  OpenAPI,
  Operation,
  Parameter,
  PathItem,
  Paths,
  Ref,
  Reference,
  RequestBody,
  Responses,
  Schema,
  SecurityRequirement,
  SecurityScheme,
  Server,
  Tag,
  Type,
} from './openapi/index.js'
