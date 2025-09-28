import { test, describe, expect } from 'vitest'
import { stringify } from '../src/index.js'

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
})
