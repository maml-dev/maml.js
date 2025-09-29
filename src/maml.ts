import { parse, stringify } from './index.js'

const getGlobal = function() {
  if (typeof globalThis !== 'undefined') return globalThis
  if (typeof window !== 'undefined') return window
  // @ts-ignore
  if (typeof global !== 'undefined') return global
  return Function('return this')()
}

getGlobal().MAML = { parse, stringify }
