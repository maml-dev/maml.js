import fs from 'node:fs'
import path from 'node:path'
import { URL } from 'node:url'

export function loadTestCases(file) {
  const __dirname = new URL('.', import.meta.url).pathname
  const content = fs.readFileSync(path.join(__dirname, file), 'utf8')
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
