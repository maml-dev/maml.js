import { describe, expect, test } from 'vitest'
import { loadTestCases } from './utils.js'
import { parse } from '../src/index.js'

function trim(x) {
  x = `${x}`.trim()
  x = x.replace(/\n\s+\n/g, '\n\n')
  return x
}

describe('error', () => {
  const testCases = loadTestCases('error.test.txt')
  for (const { name, maml, json: expectedError } of testCases) {
    test(name, () => {
      expect.assertions(1)
      try {
        parse(maml)
      } catch (error) {
        expect(trim(error)).toContain(trim(expectedError))
      }
    })
  }
})
