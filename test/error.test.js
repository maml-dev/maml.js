import { describe, expect, test } from 'vitest'
import { loadTestCases } from './utils.js'
import { parse } from '../src/index.js'

function trim(x) {
  return `${x}`
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim()
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

describe('error', () => {
  test('non-string value', () => {
    expect(() => parse(42)).toThrow('Source must be a string')
  })
})
