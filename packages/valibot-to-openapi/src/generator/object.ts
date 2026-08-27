import type { SchemaOf } from '../guard/index.js'
import { isSchemaType } from '../guard/index.js'
import { isOptionalSchema } from '../pipe/index.js'
import type { MapNullableType, MapSubSchema } from '../types/index.js'
import { isString } from '../utils/index.js'

type ObjectSchema =
  | SchemaOf<'object'>
  | SchemaOf<'loose_object'>
  | SchemaOf<'strict_object'>
  | SchemaOf<'object_with_rest'>

function additionalProperties(schema: ObjectSchema, mapItem: MapSubSchema) {
  if (schema.type === 'strict_object') {
    return { ok: true, value: { additionalProperties: false } } as const
  }
  if (schema.type === 'loose_object') {
    return { ok: true, value: { additionalProperties: true } } as const
  }
  if (schema.type === 'object_with_rest') {
    const rest = mapItem(schema.rest)
    if (!rest.ok) {
      return rest
    }
    return { ok: true, value: { additionalProperties: rest.value } } as const
  }
  return { ok: true, value: {} } as const
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
 */
export function objectSchema(
  schema: ObjectSchema,
  defaultValue: unknown,
  mapNullableType: MapNullableType,
  mapItem: MapSubSchema,
) {
  const properties = Object.entries(schema.entries).map(([key, entry]) => ({
    key,
    property: mapItem(entry),
  }))
  const failed = properties.find(({ property }) => !property.ok)
  if (failed !== undefined && !failed.property.ok) {
    return failed.property
  }
  const additional = additionalProperties(schema, mapItem)
  if (!additional.ok) {
    return additional
  }
  const required = requiredKeysOf(schema)
  return {
    ok: true,
    value: {
      ...mapNullableType('object'),
      properties: Object.fromEntries(
        properties.flatMap(({ key, property }) => (property.ok ? [[key, property.value]] : [])),
      ),
      default: defaultValue,
      ...(required.length > 0 ? { required } : {}),
      ...additional.value,
    },
  } as const
}

/**
 * `v.record(key, value)`. A `picklist` / `enum` key is expanded into fixed `properties`; any
 * other key becomes `additionalProperties`.
 */
export function recordSchema(
  schema: SchemaOf<'record'>,
  mapNullableType: MapNullableType,
  mapItem: MapSubSchema,
) {
  const valueSchema = mapItem(schema.value)
  if (!valueSchema.ok) {
    return valueSchema
  }
  if (isSchemaType(schema.key, ['picklist', 'enum'])) {
    const keys = schema.key.options.filter(isString)
    return {
      ok: true,
      value: {
        ...mapNullableType('object'),
        properties: Object.fromEntries(keys.map((key) => [key, valueSchema.value])),
      },
    } as const
  }
  return {
    ok: true,
    value: {
      ...mapNullableType('object'),
      additionalProperties: valueSchema.value,
    },
  } as const
}
