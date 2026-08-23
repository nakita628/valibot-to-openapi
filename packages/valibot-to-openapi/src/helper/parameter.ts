import type { GenericSchema } from 'valibot'

import { ConflictError, MissingParameterDataError } from '../errors/index.js'
import { isSchemaType, OBJECT_TYPES } from '../guard/index.js'
import {
  buildParameterMetadata,
  getInternalMetadata,
  getOpenApiMetadata,
  getParamMetadata,
  getRefId,
} from '../metadata/index.js'
import { isNullableSchema, isOptionalSchema } from '../pipe/index.js'
import type {
  BaseParameterObject,
  ParameterLocation,
  ParameterObject,
  ReferenceObject,
  GenerationContext,
} from '../types/index.js'
import { compact, parameterRef } from '../utils/index.js'
import { generateSchemaWithRef } from './schema.js'

type ParameterData = {
  readonly in?: ParameterLocation
  readonly name?: string
}

function getParameterRef(
  ctx: GenerationContext,
  schema: GenericSchema,
  external?: ParameterData,
): ReferenceObject | undefined {
  const parameterMetadata = getOpenApiMetadata(schema).param
  const refId = getInternalMetadata(schema).refId
  const existingRef = refId === undefined ? undefined : ctx.paramRefs.get(refId)

  if (refId === undefined || existingRef === undefined) {
    return undefined
  }

  if (
    (parameterMetadata && existingRef.in !== parameterMetadata.in) ||
    (external?.in && existingRef.in !== external.in)
  ) {
    throw new ConflictError(
      `Conflicting location for parameter ${existingRef.name}. Use the same \`in\` in the route request and in \`openapi({ param: { in } })\``,
      {
        key: 'in',
        values: compact([existingRef.in, external?.in, parameterMetadata?.in]),
      },
    )
  }

  if (
    (parameterMetadata && existingRef.name !== parameterMetadata.name) ||
    (external?.name && existingRef.name !== external.name)
  ) {
    throw new ConflictError(
      'Conflicting names for parameter. Use the same key in the route object and in `openapi({ param: { name } })`',
      {
        key: 'name',
        values: compact([existingRef.name, external?.name, parameterMetadata?.name]),
      },
    )
  }

  return { $ref: parameterRef(refId) }
}

/**
 * Builds a parameter without `name` / `in`, shared by query/path/header parameters and
 * response headers.
 */
export function generateSimpleParameter(
  ctx: GenerationContext,
  schema: GenericSchema,
  externalParamMetadata?: ParameterData,
): BaseParameterObject {
  const paramMetadata = getParamMetadata(schema).param
  const mergedParamMetadata = { ...paramMetadata, ...externalParamMetadata }
  const required = !isOptionalSchema(schema) && !isNullableSchema(schema)
  return {
    schema: generateSchemaWithRef(ctx, schema),
    required,
    ...(Object.keys(mergedParamMetadata).length > 0
      ? buildParameterMetadata(mergedParamMetadata)
      : {}),
  }
}

/**
 * Builds a full ParameterObject; `name` / `in` come from the route context or `param` metadata.
 */
export function generateParameter(
  ctx: GenerationContext,
  schema: GenericSchema,
  externalParamMetadata?: ParameterData,
): ParameterObject {
  const paramMetadata = getOpenApiMetadata(schema).param
  const paramName = externalParamMetadata?.name ?? paramMetadata?.name
  const paramLocation = externalParamMetadata?.in ?? paramMetadata?.in

  if (!paramName) {
    throw new MissingParameterDataError({ missingField: 'name' })
  }
  if (!paramLocation) {
    throw new MissingParameterDataError({ missingField: 'in', paramName })
  }

  return {
    ...generateSimpleParameter(ctx, schema, externalParamMetadata),
    in: paramLocation,
    name: paramName,
  }
}

/**
 * Generates a registered parameter (`registerParameter`) into `components.parameters`.
 */
export function generateParameterDefinition(
  ctx: GenerationContext,
  schema: GenericSchema,
): ParameterObject | ReferenceObject {
  const refId = getRefId(schema)
  const result = generateParameter(ctx, schema)
  if (refId !== undefined) {
    ctx.paramRefs.set(refId, result)
  }
  return result
}

/**
 * Expands a route parameter schema into one ParameterObject per object entry (or a single
 * parameter for a non-object schema), resolving registered parameters to `$ref`s.
 */
export function generateInlineParameters(
  ctx: GenerationContext,
  schema: GenericSchema,
  location: ParameterLocation,
): (ParameterObject | ReferenceObject)[] {
  const parameterMetadata = getOpenApiMetadata(schema).param
  const referencedSchema = getParameterRef(ctx, schema, { in: location })

  if (referencedSchema) {
    return [referencedSchema]
  }

  if (isSchemaType(schema, OBJECT_TYPES)) {
    return Object.entries(schema.entries).map(([key, entry]) => {
      const innerParameterMetadata = getOpenApiMetadata(entry).param
      const referencedEntry = getParameterRef(ctx, entry, { in: location, name: key })

      if (referencedEntry) {
        return referencedEntry
      }

      if (innerParameterMetadata?.name && innerParameterMetadata.name !== key) {
        throw new ConflictError(
          'Conflicting names for parameter. Use the same key in the route object and in `openapi({ param: { name } })`',
          { key: 'name', values: [key, innerParameterMetadata.name] },
        )
      }

      if (innerParameterMetadata?.in && innerParameterMetadata.in !== location) {
        throw new ConflictError(
          `Conflicting location for parameter ${innerParameterMetadata.name ?? key}. Use the same \`in\` in the route request and in \`openapi({ param: { in } })\``,
          { key: 'in', values: [location, innerParameterMetadata.in] },
        )
      }

      return generateParameter(ctx, entry, { name: key, in: location })
    })
  }

  if (parameterMetadata?.in && parameterMetadata.in !== location) {
    throw new ConflictError(
      `Conflicting location for parameter ${parameterMetadata.name}. Use the same \`in\` in the route request and in \`openapi({ param: { in } })\``,
      { key: 'in', values: [location, parameterMetadata.in] },
    )
  }

  return [generateParameter(ctx, schema, { in: location })]
}
