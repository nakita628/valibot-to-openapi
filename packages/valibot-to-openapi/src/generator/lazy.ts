import type { SchemaOf } from '../guard/index.js'
import type {
  MapNullableRef,
  MapNullableType,
  MapSubSchema,
  ReferenceObject,
  SchemaObject,
} from '../types/index.js'
import { isReferenceObject } from '../utils/index.js'

/**
 * Re-applies nullability to an already generated schema or reference.
 */
export function mapRecursive(
  schema: SchemaObject | ReferenceObject,
  mapNullableType: MapNullableType,
  mapNullableRef: MapNullableRef,
): SchemaObject | ReferenceObject {
  if (isReferenceObject(schema)) {
    return mapNullableRef(schema)
  }
  return schema.type ? { ...schema, ...mapNullableType(schema.type) } : schema
}

/**
 * `v.lazy(() => schema)` — resolves the getter and generates the inner schema.
 */
export function lazySchema(
  schema: SchemaOf<'lazy'>,
  mapItem: MapSubSchema,
  mapNullableType: MapNullableType,
  mapNullableRef: MapNullableRef,
) {
  return mapRecursive(mapItem(schema.getter(undefined)), mapNullableType, mapNullableRef)
}
