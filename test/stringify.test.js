import { test, describe, expect } from 'vitest'
import { stringify } from '../build/index.js'

describe('stringify', () => {
  test('int', () => {
    const output = stringify(42)
    expect(output).toStrictEqual(`42`)
  })

  test('bigint', () => {
    const output = stringify(9007199254740992n) // Number.MAX_SAFE_INTEGER + 1
    expect(output).toStrictEqual(`9007199254740992`)
  })

  test('float', () => {
    const output = stringify(1.5)
    expect(output).toStrictEqual(`1.5`)
  })

  test('boolean', () => {
    const output = stringify(true)
    expect(output).toStrictEqual(`true`)
  })

  test('null', () => {
    const output = stringify(null)
    expect(output).toStrictEqual(`null`)
  })

  test('undefined', () => {
    const output = stringify(undefined)
    expect(output).toStrictEqual(`null`)
  })

  test('string', () => {
    const output = stringify('foo')
    expect(output).toStrictEqual(`"foo"`)
  })

  test('string with quote and backslash', () => {
    expect(stringify('say "hi"')).toBe('"say \\"hi\\""')
    expect(stringify('a\\b')).toBe('"a\\\\b"')
  })

  test('string with tab', () => {
    const output = stringify('hello\tworld')
    expect(output).toBe('"hello\\tworld"')
  })

  test('string with control characters', () => {
    expect(stringify('\x00')).toBe('"\\u{0}"')
    expect(stringify('\x08')).toBe('"\\u{8}"')
    expect(stringify('\x0C')).toBe('"\\u{C}"')
    expect(stringify('\x1F')).toBe('"\\u{1F}"')
    expect(stringify('\x7F')).toBe('"\\u{7F}"')
  })

  test('string with newline and carriage return', () => {
    expect(stringify('a\nb')).toBe('"a\\nb"')
    expect(stringify('a\rb')).toBe('"a\\rb"')
  })

  test('array', () => {
    const output = stringify([1, 2, 3])
    expect(output).toStrictEqual(`[
  1
  2
  3
]`)
  })

  test('object', () => {
    const output = stringify({ foo: 'foo', bar: 'bar' })
    expect(output).toStrictEqual(`{
  foo: "foo"
  bar: "bar"
}`)
  })

  test('object with quoted keys', () => {
    const output = stringify({ 'foo bar': 'value' })
    expect(output).toStrictEqual(`{
  "foo bar": "value"
}`)
  })

  test('empty object', () => {
    const output = stringify({})
    expect(output).toStrictEqual(`{}`)
  })

  test('empty array', () => {
    const output = stringify([])
    expect(output).toStrictEqual(`[]`)
  })

  test('unsupported value', () => {
    expect(() => stringify(Symbol('x'))).toThrow()
  })

  describe('integer safety', () => {
    test('NaN throws', () => {
      expect(() => stringify(NaN)).toThrow('Cannot encode NaN')
    })

    test('Infinity throws', () => {
      expect(() => stringify(Infinity)).toThrow('Cannot encode Infinity')
    })

    test('-Infinity throws', () => {
      expect(() => stringify(-Infinity)).toThrow('Cannot encode -Infinity')
    })

    test('unsafe integer throws', () => {
      expect(() => stringify(2 ** 53)).toThrow('use BigInt')
    })

    test('negative unsafe integer throws', () => {
      expect(() => stringify(-(2 ** 53))).toThrow('use BigInt')
    })

    test('bigint exceeding 64-bit max throws', () => {
      expect(() => stringify(2n ** 63n)).toThrow('outside the 64-bit')
    })

    test('bigint below 64-bit min throws', () => {
      expect(() => stringify(-(2n ** 63n) - 1n)).toThrow('outside the 64-bit')
    })

    test('MAX_SAFE_INTEGER is fine', () => {
      expect(stringify(Number.MAX_SAFE_INTEGER)).toBe(`${Number.MAX_SAFE_INTEGER}`)
    })

    test('MIN_SAFE_INTEGER is fine', () => {
      expect(stringify(Number.MIN_SAFE_INTEGER)).toBe(`${Number.MIN_SAFE_INTEGER}`)
    })

    test('bigint at 64-bit max boundary is fine', () => {
      const I64_MAX = 2n ** 63n - 1n
      expect(stringify(I64_MAX)).toBe(`${I64_MAX}`)
    })

    test('bigint at 64-bit min boundary is fine', () => {
      const I64_MIN = -(2n ** 63n)
      expect(stringify(I64_MIN)).toBe(`${I64_MIN}`)
    })

    test('floats are not affected by integer checks', () => {
      expect(stringify(1.5)).toBe('1.5')
      expect(stringify(1e100)).toBe('1e+100')
    })
  })
})
