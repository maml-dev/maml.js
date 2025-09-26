import { expect, test } from 'vitest'
import { parse } from '../build/index.js'

test('simple', () => {
  expect(parse('{}')).toStrictEqual({})
})
