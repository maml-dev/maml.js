import { test, describe, expect } from 'vitest'
import { parse } from '../build/index.js'
import { loadTestCases } from './utils.js'

test('debug', ()=>{
  const input = `
42
  `
  parse(input)
})

describe('parse', () => {
  const testCases = loadTestCases('parse.test.txt')
  for (const { name, maml, json } of testCases) {
    test(name, () => {
      const output = parse(maml)
      const expected = JSON.parse(json)
      expect(output).toStrictEqual(expected)
    })
  }
})

describe('parse', () => {
  test('bigint', () => {
    const output = parse(`9007199254740992`) // Number.MAX_SAFE_INTEGER + 1
    expect(output).toStrictEqual(9007199254740992n)
  })
})
