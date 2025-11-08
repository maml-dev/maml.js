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

  notes:
    \`This is a multiline strings.
    \`Keeps formatting as-is.
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

  test('empty raw string', () => {
    const output = parse('`')
    expect(output).toStrictEqual('')
  })

  test('single-space raw string', () => {
    const output = parse('` ')
    expect(output).toStrictEqual(' ')
  })

  test('raw string with CRLF newlines', () => {
    const output = parse('`line1\r\n`line2\r\n`line3')
    expect(output).toStrictEqual('line1\r\nline2\r\nline3')
  })

  test('raw string with mixed CRLF and LF newlines', () => {
    const output = parse('`line1\r\n`line2\n`line3\r\n`')
    expect(output).toStrictEqual('line1\r\nline2\nline3\r\n')
  })

  test('single-line raw string with CRLF newline', () => {
    const output = parse('`simgle line\r\n')
    expect(output).toStrictEqual('simgle line')
  })

  test('single-line raw string with CR inside and CRLF newline', () => {
    const output = parse('`the \r char\r\n')
    expect(output).toStrictEqual('the \r char')
  })

  test('single-line raw string with CR at the end', () => {
    const output = parse('`string\r')
    expect(output).toStrictEqual('string\r')
  })
})
