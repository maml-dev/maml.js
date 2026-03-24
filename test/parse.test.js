import { test, describe, expect } from 'vitest'
import { parse } from '../build/index.js'
import { loadTestCases } from './utils.js'

test('example', () => {
  parse(`
{
  project: "MAML"
  tags: [
    "minimal"
    "readable"
  ]

  # A simple nested object
  spec: {
    version: 1
    author: "Anton Medvedev"
  }

  # Array of objects with nested objects
  examples: [
    {
      json: {
        name: "JSON"
        born: 2001
      }
    }
    {
      maml: {
        name: "MAML"
        born: 2025
      }
    }    
  ]

  notes: """
This is a raw multiline strings.
Keeps formatting as-is.
"""
}
  `)
})

describe('parse', () => {
  const testCases = loadTestCases('parse.test.txt')
  for (const { name, input, expected } of testCases) {
    test(name, () => {
      expect(parse(input)).toStrictEqual(JSON.parse(expected))
    })
  }
})

describe('extra', () => {
  test('bigint', () => {
    const output = parse(`9007199254740992`) // Number.MAX_SAFE_INTEGER + 1
    expect(output).toStrictEqual(9007199254740992n)
  })

  test('maml in global', async () => {
    await import('../build/maml.min.js')
    expect('MAML' in globalThis).toBeTruthy()
  })

  test('string allows literal tab', () => {
    const output = parse('"hello\tworld"')
    expect(output).toStrictEqual('hello\tworld')
  })

  test('string rejects control char U+001F', () => {
    expect(() => parse('"\x1F"')).toThrow()
  })

  test('string rejects DEL U+007F', () => {
    expect(() => parse('"\x7F"')).toThrow()
  })

  test('raw string with CRLF newlines', () => {
    const output = parse('"""line1\r\nline2\r\nline3"""')
    expect(output).toStrictEqual('line1\r\nline2\r\nline3')
  })

  test('raw string with mixed CRLF and LF newlines', () => {
    const output = parse('"""line1\r\nline2\nline3\r\n"""')
    expect(output).toStrictEqual('line1\r\nline2\nline3\r\n')
  })

  test('raw string with CR inside and CRLF newline', () => {
    const output = parse('"""the \r char\r\n"""')
    expect(output).toStrictEqual('the \r char\r\n')
  })

  test('raw string with CR at the end', () => {
    const output = parse('"""string\r"""')
    expect(output).toStrictEqual('string\r')
  })

  test('raw string with leading LF', () => {
    const output = parse('"""\nstring\r\n"""')
    expect(output).toStrictEqual('string\r\n')
  })

  test('raw string with leading CRLF', () => {
    const output = parse('"""\r\nstring\r\n"""')
    expect(output).toStrictEqual('string\r\n')
  })

  test('raw string with leading CR', () => {
    const output = parse('"""\rstring\r\n"""')
    expect(output).toStrictEqual('\rstring\r\n')
  })
})
