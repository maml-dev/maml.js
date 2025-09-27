import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watchTriggerPatterns: [
      {
        pattern: /test\/(.+?).test.txt/,
        testsToRun: () => {
          return `./test/parse.test.js`
        },
      },
    ],
    coverage: {
      reporter: ['text', 'html'],
      include: ['build'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      }
    },
  },
})
