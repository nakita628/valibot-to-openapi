<!--
Title: `type(scope): summary` — imperative mood, no trailing period. Release notes are
built from pull request titles, so write it for the person reading the releases page.

  type   feat | fix | perf | refactor | docs | test | build | ci | chore
  scope  generator | pipe | metadata | specifics | core | helper | types | errors | docs | ci

  fix(generator): emit nullable unions as oneOf with null on 3.0
-->

## Why

<!-- The bug, the missing capability or the request behind this change. Link the issue: `Closes #123`. -->

## What

<!-- What changed, as a user of the package sees it. One to three sentences. -->

## Where

<!-- Scope: the layers touched (see library-architecture), the OpenAPI versions affected, the README. Name what is deliberately left out. -->

## Who

<!-- Who notices: every user, users of one OpenAPI version, contributors only. Breaking for anyone? -->

## When

<!-- Release impact: `none` | `next release` | `version bumped to x.y.z — publishes to npm on merge`. -->

## How

<!--
The approach in a sentence, then the evidence. If a generator or the version specifics
changed, paste the relevant part of `test/out/*.yaml` after `vp run generate`.
Tick only what you ran; paste the output of anything that failed.
-->

<!-- textlint-disable no-todo -- a checklist is the one place an unchecked box is the point -->

- [ ] `vp run --filter ./packages/valibot-to-openapi build`
- [ ] `vp run -r test`
- [ ] `vp run check`
- [ ] `vp run lint`

<!-- textlint-enable no-todo -->
