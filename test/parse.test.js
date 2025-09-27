import { test, describe, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { URL } from 'node:url'
import { parse } from '../build/index.js'

function loadTestCases() {
  const __dirname = new URL('.', import.meta.url).pathname
  const content = fs.readFileSync(path.join(__dirname, 'parse.test.txt'), 'utf8')
  return content
    .split('===')
    .map((testCase) => testCase.trim())
    .filter(Boolean)
    .map((testCase) => {
      const [name, ...lines] = testCase.split('\n')
      const body = lines.join('\n')
      const [maml, json] = body.split('---')
      return { name: name.trim(), maml, json }
    })
}

describe('parse', () => {
  const testCases = loadTestCases()
  for (const { name, maml, json } of testCases) {
    test(name, () => {
      const output = parse(maml)
      const expected = JSON.parse(json)
      expect(output).toStrictEqual(expected)
    })
  }
})
