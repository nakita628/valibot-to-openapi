/**
 * Errors are plain discriminated objects carried through `{ ok: true, value } | { ok: false,
 * error }` results, never thrown. `type` is the discriminant; `message` always contains the
 * next action.
 */
export type ValibotToOpenAPIError =
  | { readonly type: 'ValibotToOpenAPIError'; readonly message: string }
  | {
      readonly type: 'ConflictError'
      readonly message: string
      readonly data: { readonly key: string; readonly values: readonly unknown[] }
    }
  | {
      readonly type: 'MissingParameterDataError'
      readonly message: string
      readonly data: {
        readonly paramName?: string
        readonly route?: string
        readonly location?: string
        readonly missingField: string
      }
    }
  | {
      readonly type: 'UnknownSchemaTypeError'
      readonly message: string
      readonly data: { readonly schemaName?: string; readonly currentSchema: unknown }
    }

// The constructors below widen to the union on purpose: it is the documented contract, and the
// bundled `.d.ts` cannot name the anonymous object types inference would produce instead.
/** The catch-all error, for a failure that fits none of the three specific shapes. */
export function valibotToOpenAPIError(message: string): ValibotToOpenAPIError {
  return { type: 'ValibotToOpenAPIError', message } as const
}

/**
 * Two definitions claim the same key with different values — the same `refId` registered twice,
 * or a route and a webhook writing the same path. `data` names the key and the values that clash.
 */
export function conflictError(
  message: string,
  data: { readonly key: string; readonly values: readonly unknown[] },
): ValibotToOpenAPIError {
  return { type: 'ConflictError', message, data } as const
}

/**
 * A parameter is missing a field OpenAPI requires (`name` or `in`), which only `openapi()`'s
 * `param` field can supply. The route and location are filled in later by
 * `enhanceMissingParametersError` as the error travels up.
 */
export function missingParameterDataError(data: {
  readonly paramName?: string
  readonly route?: string
  readonly location?: string
  readonly missingField: string
}): ValibotToOpenAPIError {
  return {
    type: 'MissingParameterDataError',
    message: `Missing parameter data, please specify \`${data.missingField}\` and other OpenAPI parameter props using the \`param\` field of \`openapi()\``,
    data,
  } as const
}

/**
 * A valibot schema type this generator has no mapping for. The way out is `openapi({ type })`,
 * which short-circuits the generation for that schema.
 */
export function unknownSchemaTypeError(data: {
  readonly schemaName?: string
  readonly currentSchema: unknown
}): ValibotToOpenAPIError {
  return {
    type: 'UnknownSchemaTypeError',
    message: `Unknown valibot schema type${
      typeof data.currentSchema === 'object' &&
      data.currentSchema !== null &&
      'type' in data.currentSchema &&
      typeof data.currentSchema.type === 'string'
        ? ` \`${data.currentSchema.type}\``
        : ''
    }, please specify \`type\` and other OpenAPI props using \`openapi()\`.`,
    data,
  } as const
}

/**
 * Merges extra context (route / location) into a `MissingParameterDataError`; other errors are
 * returned unchanged.
 */
export function enhanceMissingParametersError(
  error: ValibotToOpenAPIError,
  paramsToAdd: {
    readonly paramName?: string
    readonly route?: string
    readonly location?: string
    readonly missingField?: string
  },
): ValibotToOpenAPIError {
  return error.type === 'MissingParameterDataError'
    ? missingParameterDataError({ ...error.data, ...paramsToAdd })
    : error
}
