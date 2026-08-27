// The `valibot` namespace plus the `openapi` action, so metadata is attached the way Valibot's
// own `v.metadata` / `v.title` / `v.description` are: `v.pipe(v.string(), v.openapi({ … }))`.
export * from 'valibot'

export { openapi } from '../metadata/index.js'
