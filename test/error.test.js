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

  describe('integer out of 64-bit range', () => {
    const I64_MAX = 2n ** 63n - 1n
    const I64_MIN = -(2n ** 63n)

    test('exceeds 64-bit max', () => {
      expect(() => parse(`${I64_MAX + 1n}`)).toThrow(
        'outside the 64-bit signed integer range',
      )
    })

    test('below 64-bit min', () => {
      expect(() => parse(`${I64_MIN - 1n}`)).toThrow(
        'outside the 64-bit signed integer range',
      )
    })

    test('way beyond 64-bit range', () => {
      expect(() => parse(`${2n ** 128n}`)).toThrow(
        'outside the 64-bit signed integer range',
      )
    })

    test('64-bit max is accepted', () => {
      expect(parse(`${I64_MAX}`)).toBe(I64_MAX)
    })

    test('64-bit min is accepted', () => {
      expect(parse(`${I64_MIN}`)).toBe(I64_MIN)
    })
  })

  test('unescaped \u0000 inside string', () => {
    expect(() => parse('"\u0000"')).toThrow('Unexpected character "\\u0000" on line 1.')
  })
})
