import { defineConfig } from 'vite-plus'

// oxlint-disable-next-line import/no-default-export -- Vite resolves the config through its default export
export default defineConfig({
  pack: {
    entry: {
      index: './src/index.ts',
    },
    dts: true,
    // tsdown defaults to `.mjs` / `.d.mts` for node; `exports` points at `.js` / `.d.ts`.
    outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  },
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts', '**/node_modules/**', '**/dist/**'],
      reporter: ['text', 'text-summary'],
    },
  },
  lint: {
    ignorePatterns: ['**/dist/**'],
    // Setting `plugins` replaces oxlint's default list — restate the defaults, then add import.
    plugins: ['typescript', 'unicorn', 'oxc', 'import'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    categories: {
      correctness: 'error',
      suspicious: 'error',
      perf: 'error',
    },
    // Strict by design: exceptions live next to the code as `oxlint-disable-next-line` with a
    // reason, never as `'off'` here.
    rules: {
      eqeqeq: 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-param-reassign': ['error', { props: true }],
      'no-shadow': 'error',
      'no-underscore-dangle': 'error',
      'no-console': 'error',
      'no-plusplus': 'error',
      'no-await-in-loop': 'error',
      'no-unused-vars': 'error',
      'typescript/no-explicit-any': 'error',
      'typescript/no-non-null-assertion': 'error',
      'typescript/consistent-type-imports': 'error',
      'typescript/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      'typescript/no-unsafe-type-assertion': 'error',
      'typescript/no-unnecessary-type-assertion': 'error',
      'typescript/no-unnecessary-type-arguments': 'error',
      'typescript/no-floating-promises': 'error',
      'typescript/await-thenable': 'error',
      'typescript/no-misused-promises': 'error',
      'typescript/consistent-return': 'error',
      'typescript/require-await': 'error',
      'typescript/prefer-readonly': 'error',
      'typescript/prefer-nullish-coalescing': 'error',
      'typescript/switch-exhaustiveness-check': 'error',
      'typescript/no-unsafe-argument': 'error',
      'typescript/no-unsafe-assignment': 'error',
      'typescript/no-unsafe-member-access': 'error',
      'typescript/no-unsafe-call': 'error',
      'typescript/no-unsafe-return': 'error',
      'unicorn/consistent-function-scoping': 'error',
      'unicorn/no-array-for-each': 'error',
      'unicorn/no-array-sort': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-spread': 'error',
      'unicorn/prefer-string-replace-all': 'error',
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
      'import/no-duplicates': 'error',
      'typescript/require-array-sort-compare': 'error',
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-implied-eval': 'error',
      'no-return-assign': 'error',
      'no-constant-binary-expression': 'error',
      'no-else-return': 'error',
      'no-lonely-if': 'error',
      'prefer-object-spread': 'error',
      'symbol-description': 'error',
      'typescript/no-deprecated': 'error',
      'typescript/no-base-to-string': 'error',
      'typescript/restrict-template-expressions': 'error',
      'typescript/restrict-plus-operands': 'error',
      'typescript/no-redundant-type-constituents': 'error',
      'typescript/no-duplicate-type-constituents': 'error',
      'typescript/no-unnecessary-template-expression': 'error',
      'typescript/no-unnecessary-boolean-literal-compare': 'error',
      'typescript/no-unnecessary-type-parameters': 'error',
      'typescript/no-confusing-void-expression': 'error',
      'typescript/no-for-in-array': 'error',
      'typescript/no-implied-eval': 'error',
      'typescript/no-unsafe-enum-comparison': 'error',
      'typescript/no-unsafe-unary-minus': 'error',
      'typescript/only-throw-error': 'error',
      'typescript/prefer-promise-reject-errors': 'error',
      'typescript/prefer-reduce-type-parameter': 'error',
      'typescript/prefer-includes': 'error',
      'typescript/prefer-string-starts-ends-with': 'error',
      'typescript/prefer-optional-chain': 'error',
      'typescript/use-unknown-in-catch-callback-variable': 'error',
      'typescript/unbound-method': 'error',
      'typescript/return-await': 'error',
      'unicorn/no-await-expression-member': 'error',
      'unicorn/no-useless-spread': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-set-has': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/prefer-at': 'error',
      'unicorn/explicit-length-check': 'error',
      'unicorn/throw-new-error': 'error',
      'import/no-default-export': 'error',
      'import/no-mutable-exports': 'error',
      'import/no-absolute-path': 'error',
      'import/no-empty-named-blocks': 'error',
      'import/no-named-as-default-member': 'error',
      'import/first': 'error',
    },
    // Architecture rules for src: each directory may import only the siblings listed in its
    // message. Dependency direction is one-way:
    //   utils / openapi / errors / guard (leaves) → types (re-exports the openapi model)
    //     → metadata / specifics
    //     → generator (per-schema-type transformers, pure)
    //     → helper (composition with the generation context; inside helper the sub-layers are
    //       one-way as well: schema → parameter → route → components, imported directly, never
    //       through the barrel)
    //     → core (public entry points)
    overrides: [
      {
        files: ['src/utils/**', 'src/openapi/**', 'src/errors/**', 'src/guard/**'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: [
                {
                  regex: '^\\.\\./',
                  message: 'leaf module: no project-internal imports allowed',
                },
              ],
            },
          ],
        },
      },
      {
        files: ['src/types/**'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: [
                {
                  regex:
                    '^(\\.\\./)+(core|generator|guard|helper|metadata|pipe|specifics|utils)(/.*)?$',
                  message: 'types may only import openapi, errors',
                },
              ],
            },
          ],
        },
      },
      {
        files: ['src/metadata/**'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: [
                {
                  regex: '^(\\.\\./)+(core|errors|generator|helper|specifics)(/.*)?$',
                  message: 'metadata may only import utils, guard, types',
                },
              ],
            },
          ],
        },
      },
      {
        files: ['src/specifics/**'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: [
                {
                  regex: '^(\\.\\./)+(core|errors|generator|guard|helper|metadata)(/.*)?$',
                  message: 'specifics may only import utils, types',
                },
              ],
            },
          ],
        },
      },
      {
        files: ['src/generator/**'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: [
                {
                  regex: '^(\\.\\./)+(core|helper)(/.*)?$',
                  message:
                    'generator may only import utils, guard, types, errors, metadata, specifics',
                },
              ],
            },
          ],
        },
      },
      {
        files: ['src/helper/**'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: [
                {
                  regex: '^(\\.\\./)+(core)(/.*)?$',
                  message:
                    'helper may only import utils, guard, types, errors, metadata, specifics, generator',
                },
                {
                  regex: '^\\./index(\\.js)?$',
                  message:
                    'import helper modules directly, not via the helper/index.ts barrel (cycle risk)',
                },
              ],
            },
          ],
        },
      },
      {
        // Test files may cast and use `any` (CLAUDE.md 型安全 #1); the type-safety rules that
        // exist only to police those casts are scoped off here, nothing else is.
        files: ['**/*.test.ts'],
        plugins: ['vitest'],
        rules: {
          'no-restricted-imports': 'off',
          'typescript/no-explicit-any': 'off',
          'typescript/consistent-type-assertions': 'off',
          'typescript/no-unsafe-type-assertion': 'off',
          'typescript/no-unsafe-argument': 'off',
          'typescript/no-unsafe-assignment': 'off',
          'typescript/no-unsafe-member-access': 'off',
          'typescript/no-unsafe-call': 'off',
          'typescript/no-unsafe-return': 'off',
          'unicorn/no-array-sort': 'off',
          'vitest/no-focused-tests': 'error',
          'vitest/no-disabled-tests': 'error',
          'vitest/no-commented-out-tests': 'error',
          'vitest/expect-expect': 'error',
          'vitest/require-mock-type-parameters': 'error',
        },
      },
    ],
  },
  // Style (printWidth / quotes / semicolons / import sorting) is inherited from the root
  // vite.config.ts; only the paths this workspace skips are declared here.
  fmt: {
    ignorePatterns: ['**/node_modules/**', '**/dist/**'],
  },
})
