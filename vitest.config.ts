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
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      }
    },
  },
})
