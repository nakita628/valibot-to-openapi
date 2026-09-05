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
) {
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
  const inner = mapItem(schema.getter(undefined))
  if (!inner.ok) {
    return inner
  }
  return { ok: true, value: mapRecursive(inner.value, mapNullableType, mapNullableRef) } as const
}
