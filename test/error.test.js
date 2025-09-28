import { test, describe, expect } from 'vitest'
import { parse } from '../build/index.js'
import { loadTestCases, trim } from './utils.js'

describe('error', () => {
  const testCases = loadTestCases('error.test.txt')
  for (const { name, input, expected } of testCases) {
    const expectedError = trim(expected)
    test(name, () => {
      expect.assertions(1)
      try {
        parse(input)
      } catch (error) {
        expect(trim(error)).toContain(expectedError)
        if (expectedError.length < 10) expect.fail(`expected error is too short ${JSON.stringify(expectedError)}.\n\n${error}`)
      }
    })
  }

  test('non-string value', () => {
    expect(() => parse(42)).toThrow('Source must be a string')
  })

  test('unescaped \u0000 inside string', () => {
    expect(() => parse('"\u0000"')).toThrow('Unescaped control character "\\u0000"')
  })
})
