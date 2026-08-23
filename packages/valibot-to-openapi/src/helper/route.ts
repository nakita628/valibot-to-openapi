import type { GenericSchema } from 'valibot'

import { enhanceMissingParametersError } from '../errors/index.js'
import { isSchema, isSchemaType, OBJECT_TYPES } from '../guard/index.js'
import type {
  ContentConfig,
  ContentObject,
  HeadersObject,
  MediaTypeConfig,
  MediaTypeObject,
  ParameterObject,
  PathItemObject,
  ReferenceObject,
  RequestBodyConfig,
  RequestBodyObject,
  ResponseConfig,
  ResponseObject,
  RouteConfig,
  GenerationContext,
} from '../types/index.js'
import { isReferenceObject, mapValues } from '../utils/index.js'
import { generateInlineParameters, generateSimpleParameter } from './parameter.js'
import { generateSchemaWithRef } from './schema.js'

function getParameters(
  ctx: GenerationContext,
  request: RouteConfig['request'] | undefined,
): (ParameterObject | ReferenceObject)[] {
  if (!request) {
    return []
  }
  const { headers, query, params, cookies } = request

  const queryParameters = enhanceMissingParametersError(
    () => (query ? generateInlineParameters(ctx, query, 'query') : []),
    { location: 'query' },
  )
  const pathParameters = enhanceMissingParametersError(
    () => (params ? generateInlineParameters(ctx, params, 'path') : []),
    { location: 'path' },
  )
  const cookieParameters = enhanceMissingParametersError(
    () => (cookies ? generateInlineParameters(ctx, cookies, 'cookie') : []),
    { location: 'cookie' },
  )
  const headerParameters = enhanceMissingParametersError(
    () => {
      if (headers === undefined) {
        return []
      }
      if (isSchema(headers)) {
        return generateInlineParameters(ctx, headers, 'header')
      }
      return headers.flatMap((header) => generateInlineParameters(ctx, header, 'header'))
    },
    { location: 'header' },
  )

  return [...pathParameters, ...queryParameters, ...headerParameters, ...cookieParameters]
}

function getMediaType(
  ctx: GenerationContext,
  config: MediaTypeConfig | ReferenceObject,
): MediaTypeObject | ReferenceObject {
  if (isReferenceObject(config)) {
    return config
  }
  const { schema: configSchema, itemSchema: configItemSchema, ...rest } = config
  // Both `schema` and the 3.2 `itemSchema` accept either a valibot schema (converted and
  // registered so it `$ref`s) or a raw SchemaObject / ReferenceObject (passed through).
  const schema = isSchema(configSchema) ? generateSchemaWithRef(ctx, configSchema) : configSchema
  const itemSchema = isSchema(configItemSchema)
    ? generateSchemaWithRef(ctx, configItemSchema)
    : configItemSchema
  return {
    ...rest,
    ...(schema === undefined ? {} : { schema }),
    ...(itemSchema === undefined ? {} : { itemSchema }),
  }
}

function getBodyContent(ctx: GenerationContext, content: ContentConfig): ContentObject {
  return Object.fromEntries(
    Object.entries(content).flatMap(([mediaType, config]) =>
      config === undefined ? [] : [[mediaType, getMediaType(ctx, config)] as const],
    ),
  )
}

function getRequestBody(
  ctx: GenerationContext,
  requestBody: RequestBodyConfig | undefined,
): RequestBodyObject | undefined {
  if (!requestBody) {
    return undefined
  }
  const { content, ...rest } = requestBody
  return { ...rest, content: getBodyContent(ctx, content) }
}

function getResponseHeaders(ctx: GenerationContext, headers: GenericSchema): HeadersObject {
  return isSchemaType(headers, OBJECT_TYPES)
    ? mapValues(headers.entries, (entry) => generateSimpleParameter(ctx, entry))
    : {}
}

function getResponse(
  ctx: GenerationContext,
  response: ResponseConfig | ReferenceObject,
): ResponseObject | ReferenceObject {
  if (isReferenceObject(response)) {
    return response
  }
  const { content, headers, ...rest } = response
  const responseContent = content ? { content: getBodyContent(ctx, content) } : {}
  if (!headers) {
    return { ...rest, ...responseContent }
  }
  const responseHeaders = isSchema(headers) ? getResponseHeaders(ctx, headers) : headers
  return { ...rest, headers: responseHeaders, ...responseContent }
}

/**
 * Generates the PathItemObject fragment (`{ [method]: operation }`) for one route.
 */
export function generatePath(ctx: GenerationContext, route: RouteConfig): PathItemObject {
  const { method, path, request, responses, ...pathItemConfig } = route
  const generatedResponses = mapValues(responses, (response) => getResponse(ctx, response))
  const parameters = enhanceMissingParametersError(() => getParameters(ctx, request), {
    route: `${method} ${path}`,
  })
  const requestBody = getRequestBody(ctx, request?.body)
  return {
    [method]: {
      ...pathItemConfig,
      ...(parameters.length > 0
        ? { parameters: [...(pathItemConfig.parameters ?? []), ...parameters] }
        : {}),
      ...(requestBody ? { requestBody } : {}),
      responses: generatedResponses,
    },
  }
}

/**
 * Generates a route and merges it into the `paths` (or `webhooks`) map of the context.
 */
export function generateSingleRoute(
  ctx: GenerationContext,
  route: RouteConfig,
  target: 'paths' | 'webhooks',
): PathItemObject {
  const refs = target === 'paths' ? ctx.pathRefs : ctx.webhookRefs
  const routeDoc = generatePath(ctx, route)
  refs.set(route.path, { ...refs.get(route.path), ...routeDoc })
  return routeDoc
}
