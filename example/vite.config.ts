import { defineConfig } from 'vite-plus'

// oxlint-disable-next-line import/no-default-export -- Vite resolves the config through its default export
export default defineConfig({
  lint: {
    ignorePatterns: ['**/node_modules/**', 'out/**'],
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
    rules: {
      eqeqeq: 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-shadow': 'error',
      'no-unused-vars': 'error',
      // A script prints its report on purpose.
      'no-console': 'off',
      'typescript/no-explicit-any': 'error',
      'typescript/consistent-type-imports': 'error',
      'typescript/no-floating-promises': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'import/no-default-export': 'error',
    },
  },
  fmt: {
    ignorePatterns: ['**/node_modules/**', 'out/**'],
  },
})
