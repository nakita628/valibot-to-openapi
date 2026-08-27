import * as v from 'valibot-to-openapi/valibot'

export const User = v.pipe(
  v.object({
    id: v.pipe(v.string(), v.uuid()),
    name: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
    email: v.pipe(v.string(), v.email()),
    age: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
    role: v.optional(v.picklist(['admin', 'member']), 'member'),
  }),
  v.openapi('User', { description: 'A registered user' }),
)

export const Post = v.pipe(
  v.object({
    id: v.pipe(v.string(), v.uuid()),
    title: v.pipe(v.string(), v.nonEmpty()),
    body: v.nullable(v.string()),
    author: User,
    tags: v.array(v.string()),
    publishedAt: v.optional(v.date()),
  }),
  v.openapi('Post'),
)

export const routes = [
  {
    method: 'get',
    path: '/users/{id}',
    operationId: 'getUser',
    request: { params: v.object({ id: v.pipe(v.string(), v.uuid()) }) },
    responses: {
      200: { description: 'The user', content: { 'application/json': { schema: User } } },
      404: { description: 'Not found' },
    },
  },
  {
    method: 'get',
    path: '/posts',
    operationId: 'listPosts',
    request: {
      query: v.object({
        limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100))),
        tag: v.optional(v.string()),
      }),
    },
    responses: {
      200: { description: 'Posts', content: { 'application/json': { schema: v.array(Post) } } },
    },
  },
  {
    method: 'post',
    path: '/posts',
    operationId: 'createPost',
    request: { body: { required: true, content: { 'application/json': { schema: Post } } } },
    responses: { 201: { description: 'Created' } },
  },
] as const

export const info = { title: 'Simple API', version: '1.0.0' } as const
