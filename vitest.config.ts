import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watchTriggerPatterns: [
      {
        pattern: /test\/(.+?).test.txt/,
        testsToRun: (id, match) => {
          return `./test/${match[1]}.test.js`
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
