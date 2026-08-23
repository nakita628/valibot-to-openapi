import type { GenericSchema } from 'valibot'

import { UnknownSchemaTypeError } from '../errors/index.js'
import { isSchemaType, OBJECT_TYPES, TUPLE_TYPES } from '../guard/index.js'
import { getRefId } from '../metadata/index.js'
import type {
  GeneratorOptions,
  MapSubSchema,
  ReferenceObject,
  SchemaObject,
  VersionSpecifics,
} from '../types/index.js'
import { arraySchema, setSchema, tupleSchema } from './array.js'
import { lazySchema } from './lazy.js'
import { enumSchema, literalSchema } from './literal.js'
import { bigintSchema, dateSchema, numberSchema } from './number.js'
import { objectSchema, recordSchema } from './object.js'
import { stringSchema } from './string.js'
import { intersectSchema, unionSchema, variantSchema } from './union.js'

export type TransformContext = {
  readonly specifics: VersionSpecifics
  readonly options: GeneratorOptions | undefined
  readonly mapItem: MapSubSchema
  readonly generateSchemaRef: (refId: string) => string
}

/**
 * Converts an unwrapped valibot schema to an OpenAPI SchemaObject. Nullability and the default
 * value are computed by the caller from the wrapped schema; `mapItem` registers sub-schemas.
 */
export function transformSchema(
  schema: GenericSchema,
  isNullable: boolean,
  defaultValue: unknown,
  ctx: TransformContext,
): SchemaObject | ReferenceObject {
  const { specifics, mapItem } = ctx
  if (isSchemaType(schema, 'null')) {
    return specifics.nullType
  }
  if (isSchemaType(schema, ['unknown', 'any'])) {
    return specifics.mapNullableType(undefined, isNullable)
  }
  if (isSchemaType(schema, OBJECT_TYPES)) {
    return objectSchema(
      schema,
      defaultValue,
      (type) => specifics.mapNullableType(type, isNullable),
      mapItem,
    )
  }
  return { ...transformWithoutDefault(schema, isNullable, ctx), default: defaultValue }
}

function transformWithoutDefault(
  schema: GenericSchema,
  isNullable: boolean,
  ctx: TransformContext,
): SchemaObject | ReferenceObject {
  const { specifics, options, mapItem, generateSchemaRef } = ctx
  const mapNullableType = (type: Parameters<VersionSpecifics['mapNullableType']>[0]) =>
    specifics.mapNullableType(type, isNullable)
  const mapNullableOfArray = (objects: (SchemaObject | ReferenceObject)[]) =>
    specifics.mapNullableOfArray(objects, isNullable)

  if (isSchemaType(schema, 'string')) {
    return stringSchema(schema, mapNullableType)
  }
  if (isSchemaType(schema, 'number')) {
    return numberSchema(schema, mapNullableType, specifics.getNumberChecks)
  }
  if (isSchemaType(schema, 'bigint')) {
    return bigintSchema(mapNullableType)
  }
  if (isSchemaType(schema, 'boolean')) {
    return mapNullableType('boolean')
  }
  if (isSchemaType(schema, 'date')) {
    return dateSchema(mapNullableType)
  }
  if (isSchemaType(schema, 'lazy')) {
    return lazySchema(schema, mapItem, mapNullableType, (ref) =>
      specifics.mapNullableOfRef(ref, isNullable),
    )
  }
  if (isSchemaType(schema, 'literal')) {
    return literalSchema(schema, mapNullableType)
  }
  if (isSchemaType(schema, ['picklist', 'enum'])) {
    return enumSchema(schema, isNullable, mapNullableType)
  }
  if (isSchemaType(schema, 'array')) {
    return arraySchema(schema, mapNullableType, mapItem)
  }
  if (isSchemaType(schema, 'set')) {
    return setSchema(schema, mapNullableType, mapItem)
  }
  if (isSchemaType(schema, TUPLE_TYPES)) {
    return tupleSchema(schema, mapNullableType, mapItem, specifics.mapTupleItems)
  }
  if (isSchemaType(schema, 'variant')) {
    return variantSchema(
      schema,
      isNullable,
      specifics.mapNullableOfArray,
      mapItem,
      generateSchemaRef,
    )
  }
  if (isSchemaType(schema, 'union')) {
    return unionSchema(schema, mapNullableOfArray, mapItem, options?.unionPreferredType)
  }
  if (isSchemaType(schema, 'intersect')) {
    return intersectSchema(schema, isNullable, specifics.mapNullableOfArray, mapItem)
  }
  if (isSchemaType(schema, 'record')) {
    return recordSchema(schema, mapNullableType, mapItem)
  }
  throw new UnknownSchemaTypeError({ currentSchema: schema, schemaName: getRefId(schema) })
}
