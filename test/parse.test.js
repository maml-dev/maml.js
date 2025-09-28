import { test, describe, expect } from 'vitest'
import { parse } from '../build/index.js'
import fs from 'node:fs'
import path from 'node:path'
import { URL } from 'node:url'

function loadTestCases(file) {
  const __dirname = new URL('.', import.meta.url).pathname
  const content = fs.readFileSync(path.join(__dirname, file), 'utf8')
  return content
    .split('===')
    .map((testCase) => testCase.trim())
    .filter(Boolean)
    .map((testCase) => {
      const [name, ...lines] = testCase.split('\n')
      const body = lines.join('\n')
      const [input, expected] = body.split('---')
      return { name: name.trim(), input, expected }
    })
}

function trim(x) {
  return `${x}`
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim()
}

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
This is a multiline strings.
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

  test('bigint', () => {
    const output = parse(`9007199254740992`) // Number.MAX_SAFE_INTEGER + 1
    expect(output).toStrictEqual(9007199254740992n)
  })
})

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
