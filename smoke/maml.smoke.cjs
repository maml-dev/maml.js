const assert = require('assert')
require('../maml.min.js')

const d1 = {
  project: 'MAML',
  tags: [
    'minimal',
    'readable'
  ]
}
const d2 = MAML.parse(MAML.stringify(d1))

assert.deepEqual(d1, d2)
console.log('smoke CJS — ok')
