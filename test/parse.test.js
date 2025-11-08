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
})
