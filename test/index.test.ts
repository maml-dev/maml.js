import { test, describe, expect } from 'vitest'
import * as MAML from '../build/index.js'

describe('index', () => {
  test('exports MAML', () => {
    expect(typeof MAML.parse).toBe('function')
    expect(typeof MAML.stringify).toBe('function')
  })
})
