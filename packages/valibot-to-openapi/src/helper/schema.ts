import type { GenericSchema } from 'valibot'

import { transformSchema } from '../generator/index.js'
import { mapRecursive } from '../generator/lazy.js'
import {
  applySchemaMetadata,
  buildSchemaMetadata,
  getOpenApiMetadata,
  getRefId,
} from '../metadata/index.js'
import { getDefaultValue, isNullableSchema, unwrapChained } from '../pipe/index.js'
import type { GenerationContext, ReferenceObject, SchemaObject } from '../types/index.js'
import { isEqual, omitBy, schemaRef } from '../utils/index.js'

function toOpenAPISchema(
  ctx: GenerationContext,
  schema: GenericSchema,
  isNullable: boolean,
  defaultValue: unknown,
) {
  return transformSchema(schema, isNullable, defaultValue, {
    specifics: ctx.specifics,
    options: ctx.options,
    mapItem: (item) => generateSchemaWithRef(ctx, item),
    generateSchemaRef: schemaRef,
  })
}

function generateSchemaWithMetadata(
  ctx: GenerationContext,
  schema: GenericSchema,
): SchemaObject | ReferenceObject {
  const innerSchema = unwrapChained(schema)
  const metadata = getOpenApiMetadata(schema)
  const defaultValue = getDefaultValue(schema)
  const refId = getRefId(schema)
  const existing = refId === undefined ? undefined : ctx.schemaRefs.get(refId)

  if (typeof existing === 'object') {
    return existing
  }

  // A pending generation with this name means the schema is recursive: reference it directly.
  if (existing === 'pending' && refId !== undefined) {
    return ctx.specifics.mapNullableOfRef({ $ref: schemaRef(refId) }, isNullableSchema(schema))
  }

  // Mark the ref as pending so recursive definitions can reference it. It is replaced by the
  // generated schema within `generateSchemaWithRef`.
  if (refId !== undefined && existing === undefined) {
    ctx.schemaRefs.set(refId, 'pending')
  }

  const result = metadata.type
    ? { type: metadata.type }
    : toOpenAPISchema(ctx, innerSchema, isNullableSchema(schema), defaultValue)

  return applySchemaMetadata(result, metadata)
}

/**
 * Same as `generateSchemaWithMetadata` but applies nullability to an already referenced schema.
 */
function constructReferencedOpenAPISchema(
  ctx: GenerationContext,
  schema: GenericSchema,
): SchemaObject | ReferenceObject {
  const metadata = getOpenApiMetadata(schema)
  const innerSchema = unwrapChained(schema)
  const defaultValue = getDefaultValue(schema)
  const isNullable = isNullableSchema(schema)

  if (metadata.type) {
    return ctx.specifics.mapNullableType(metadata.type, isNullable)
  }

  const refId = getRefId(schema)
  const existing = refId === undefined ? undefined : ctx.schemaRefs.get(refId)

  if (typeof existing === 'object') {
    return {
      ...mapRecursive(
        existing,
        (type) => ctx.specifics.mapNullableType(type, isNullable),
        (ref) => ctx.specifics.mapNullableOfRef(ref, isNullable),
      ),
      ...(defaultValue === undefined ? {} : { default: defaultValue }),
    }
  }

  if (existing === 'pending' && refId !== undefined) {
    return ctx.specifics.mapNullableOfRef({ $ref: schemaRef(refId) }, isNullable)
  }

  if (refId !== undefined && existing === undefined) {
    ctx.schemaRefs.set(refId, 'pending')
  }

  return toOpenAPISchema(ctx, innerSchema, isNullable, defaultValue)
}

/**
 * Generates an OpenAPI SchemaObject or a ReferenceObject with all the provided metadata applied.
 */
function generateSimpleSchema(
  ctx: GenerationContext,
  schema: GenericSchema,
): SchemaObject | ReferenceObject {
  const metadata = getOpenApiMetadata(schema)
  const refId = getRefId(schema)
  const existing = refId === undefined ? undefined : ctx.schemaRefs.get(refId)

  if (refId === undefined || existing === undefined) {
    return generateSchemaWithMetadata(ctx, schema)
  }

  const referenceObject: ReferenceObject = { $ref: schemaRef(refId) }

  // We are currently calculating this schema or there is nothing
  if (existing === 'pending') {
    return ctx.specifics.mapNullableOfRef(referenceObject, isNullableSchema(schema))
  }

  const differsFromRegistered = (value: unknown, key: string) =>
    value === undefined || isEqual(value, Reflect.get(existing, key))

  // Metadata provided from `openapi()` that is new to what we had already registered
  const newMetadata = omitBy(buildSchemaMetadata(metadata), differsFromRegistered)

  // Do not calculate schema metadata overrides if type is provided in `openapi()`
  if (newMetadata.type) {
    return { allOf: [referenceObject, newMetadata] }
  }

  // New metadata from the valibot schema's own properties (nullable, default, ...)
  const newSchemaMetadata = omitBy(
    constructReferencedOpenAPISchema(ctx, schema),
    differsFromRegistered,
  )

  const appliedMetadata = applySchemaMetadata(newSchemaMetadata, newMetadata)

  return Object.keys(appliedMetadata).length > 0
    ? { allOf: [referenceObject, appliedMetadata] }
    : referenceObject
}

/**
 * Generates the schema and, when it carries a `refId`, registers it under
 * `components.schemas` and returns a `$ref` instead of the inline schema.
 */
export function generateSchemaWithRef(
  ctx: GenerationContext,
  schema: GenericSchema,
): SchemaObject | ReferenceObject {
  const refId = getRefId(schema)
  if (refId !== undefined && !ctx.schemaRefs.has(refId)) {
    ctx.schemaRefs.set(refId, generateSimpleSchema(ctx, schema))
    return { $ref: schemaRef(refId) }
  }
  return generateSimpleSchema(ctx, schema)
}

/**
 * Registered schemas, excluding any still marked as pending.
 */
export function filteredSchemaRefs(ctx: GenerationContext) {
  return Object.fromEntries(
    [...ctx.schemaRefs.entries()].flatMap(([refId, value]) =>
      value === 'pending' ? [] : [[refId, value] as const],
    ),
  )
}
