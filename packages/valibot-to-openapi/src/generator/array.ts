import type { SchemaOf } from '../guard/index.js'
import { findValidation, inputValidations, requirementNumber } from '../pipe/index.js'
import type { MapNullableType, MapSubSchema, VersionSpecifics } from '../types/index.js'

/**
 * `v.array(item)` with length validations.
 *
 * @example
 * arraySchema(v.pipe(v.array(v.string()), v.minLength(1)), mapNullableType, mapItem)
 * // { type: 'array', items: { type: 'string' }, minItems: 1 }
 */
export function arraySchema(
  schema: SchemaOf<'array'>,
  mapNullableType: MapNullableType,
  mapItem: MapSubSchema,
) {
  const validations = inputValidations(schema)
  const length = requirementNumber(validations, 'length')
  const nonEmpty = findValidation(validations, 'non_empty') === undefined ? undefined : 1
  return {
    ...mapNullableType('array'),
    items: mapItem(schema.item),
    minItems: length ?? requirementNumber(validations, 'min_length') ?? nonEmpty,
    maxItems: length ?? requirementNumber(validations, 'max_length'),
  }
}

/**
 * `v.set(value)` → array with `uniqueItems`.
 */
export function setSchema(
  schema: SchemaOf<'set'>,
  mapNullableType: MapNullableType,
  mapItem: MapSubSchema,
) {
  const validations = inputValidations(schema)
  return {
    ...mapNullableType('array'),
    items: mapItem(schema.value),
    uniqueItems: true,
    minItems: requirementNumber(validations, 'min_size'),
    maxItems: requirementNumber(validations, 'max_size'),
  }
}

/**
 * `v.tuple([...])` / `v.tupleWithRest([...], rest)` — the per-version layout (`items` +
 * `minItems` / `maxItems` for 3.0, `prefixItems` for 3.1+) comes from the specifics.
 */
export function tupleSchema(
  schema:
    | SchemaOf<'tuple'>
    | SchemaOf<'strict_tuple'>
    | SchemaOf<'loose_tuple'>
    | SchemaOf<'tuple_with_rest'>,
  mapNullableType: MapNullableType,
  mapItem: MapSubSchema,
  mapTupleItems: VersionSpecifics['mapTupleItems'],
) {
  const rest = 'rest' in schema ? mapItem(schema.rest) : undefined
  return {
    ...mapNullableType('array'),
    ...mapTupleItems(
      schema.items.map((item) => mapItem(item)),
      rest,
    ),
  }
}
