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

export function valibotToOpenAPIError(message: string): ValibotToOpenAPIError {
  return { type: 'ValibotToOpenAPIError', message } as const
}

export function conflictError(
  message: string,
  data: { readonly key: string; readonly values: readonly unknown[] },
): ValibotToOpenAPIError {
  return { type: 'ConflictError', message, data } as const
}

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
