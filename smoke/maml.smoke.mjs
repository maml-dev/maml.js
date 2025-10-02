import assert from 'node:assert'
import '../build/index.js'

const d1 = {
  project: 'MAML',
  tags: [
    'minimal',
    'readable'
  ]
}
const d2 = MAML.parse(MAML.stringify(d1))

assert.deepEqual(d1, d2)
console.log('smoke ESM — ok')
