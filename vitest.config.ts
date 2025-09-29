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
      include: ['build', 'src'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      }
    },
  },
})
