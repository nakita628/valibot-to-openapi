export class ValibotToOpenAPIError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValibotToOpenAPIError'
  }
}

export class ConflictError extends ValibotToOpenAPIError {
  readonly data: { readonly key: string; readonly values: readonly unknown[] }

  constructor(
    message: string,
    data: { readonly key: string; readonly values: readonly unknown[] },
  ) {
    super(message)
    this.name = 'ConflictError'
    this.data = data
  }
}

export type MissingParameterDataErrorProps = {
  readonly paramName?: string
  readonly route?: string
  readonly location?: string
  readonly missingField: string
}

export class MissingParameterDataError extends ValibotToOpenAPIError {
  readonly data: MissingParameterDataErrorProps

  constructor(data: MissingParameterDataErrorProps) {
    super(
      `Missing parameter data, please specify \`${data.missingField}\` and other OpenAPI parameter props using the \`param\` field of \`openapi()\``,
    )
    this.name = 'MissingParameterDataError'
    this.data = data
  }
}

export class UnknownSchemaTypeError extends ValibotToOpenAPIError {
  readonly data: { readonly schemaName?: string; readonly currentSchema: unknown }

  constructor(data: { readonly schemaName?: string; readonly currentSchema: unknown }) {
    super(
      `Unknown valibot schema type${
        typeof data.currentSchema === 'object' &&
        data.currentSchema !== null &&
        'type' in data.currentSchema &&
        typeof data.currentSchema.type === 'string'
          ? ` \`${data.currentSchema.type}\``
          : ''
      }, please specify \`type\` and other OpenAPI props using \`openapi()\`.`,
    )
    this.name = 'UnknownSchemaTypeError'
    this.data = data
  }
}

/**
 * Re-throws a `MissingParameterDataError` with extra context (route / location) merged in.
 */
export function enhanceMissingParametersError<T>(
  action: () => T,
  paramsToAdd: Partial<MissingParameterDataErrorProps>,
): T {
  try {
    return action()
  } catch (error: unknown) {
    if (error instanceof MissingParameterDataError) {
      throw new MissingParameterDataError({ ...error.data, ...paramsToAdd })
    }
    throw error
  }
}
