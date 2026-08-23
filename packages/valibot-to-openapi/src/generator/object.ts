import type { SchemaOf } from '../guard/index.js'
import { isSchemaType } from '../guard/index.js'
import { isOptionalSchema } from '../pipe/index.js'
import type { MapNullableType, MapSubSchema, SchemaObject } from '../types/index.js'
import { isString, mapValues } from '../utils/index.js'

type ObjectSchema =
  | SchemaOf<'object'>
  | SchemaOf<'loose_object'>
  | SchemaOf<'strict_object'>
  | SchemaOf<'object_with_rest'>

function additionalProperties(schema: ObjectSchema, mapItem: MapSubSchema) {
  if (schema.type === 'strict_object') {
    return { additionalProperties: false }
  }
  if (schema.type === 'loose_object') {
    return { additionalProperties: true }
  }
  if (schema.type === 'object_with_rest') {
    return { additionalProperties: mapItem(schema.rest) }
  }
  return {}
}

/**
 * Keys whose entry schema does not accept a missing value.
 */
export function requiredKeysOf(schema: ObjectSchema) {
  return Object.entries(schema.entries)
    .filter(([, entry]) => !isOptionalSchema(entry))
    .map(([key]) => key)
}

/**
 * `v.object` / `v.looseObject` / `v.strictObject` / `v.objectWithRest`.
 *
 * @example
 * objectSchema(v.object({ id: v.string(), name: v.optional(v.string()) }), undefined, mapNullableType, mapItem)
 * // { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } }, required: ['id'] }
 */
export function objectSchema(
  schema: ObjectSchema,
  defaultValue: unknown,
  mapNullableType: MapNullableType,
  mapItem: MapSubSchema,
): SchemaObject {
  const required = requiredKeysOf(schema)
  return {
    ...mapNullableType('object'),
    properties: mapValues(schema.entries, mapItem),
    default: defaultValue,
    ...(required.length > 0 ? { required } : {}),
    ...additionalProperties(schema, mapItem),
  }
}

/**
 * `v.record(key, value)`. A `picklist` / `enum` key is expanded into fixed `properties`; any
 * other key becomes `additionalProperties`.
 */
export function recordSchema(
  schema: SchemaOf<'record'>,
  mapNullableType: MapNullableType,
  mapItem: MapSubSchema,
): SchemaObject {
  const valueSchema = mapItem(schema.value)
  if (isSchemaType(schema.key, ['picklist', 'enum'])) {
    const keys = schema.key.options.filter(isString)
    return {
      ...mapNullableType('object'),
      properties: Object.fromEntries(keys.map((key) => [key, valueSchema])),
    }
  }
  return {
    ...mapNullableType('object'),
    additionalProperties: valueSchema,
  }
}
