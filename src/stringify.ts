export function stringify(value: any): string {
  return doStringify(value, 0)
}

function doStringify(value: any, level: number): string {
  const kind =
    value === null ? 'null' :
      Array.isArray(value) ? 'array' :
        typeof value

  switch (kind) {
    case 'string':
      return JSON.stringify(value)

    case 'boolean':
    case 'bigint':
    case 'number':
      return `${value}`

    case 'null':
    case 'undefined':
      return 'null'

    case 'array': {
      const len = value.length
      if (len === 0) return '[]'

      const childIndent = getIndent(level + 1)
      const parentIndent = getIndent(level)
      let out = '[\n'
      for (let i = 0; i < len; i++) {
        if (i > 0) out += '\n'
        out += childIndent + doStringify(value[i], level + 1)
      }
      return out + '\n' + parentIndent + ']'
    }

    case 'object': {
      const keys = Object.keys(value)
      const len = keys.length
      if (len === 0) return '{}'

      const childIndent = getIndent(level + 1)
      const parentIndent = getIndent(level)
      let out = '{\n'
      for (let i = 0; i < len; i++) {
        if (i > 0) out += '\n'
        const key = keys[i]
        out += childIndent + doKeyStringify(key) + ': ' + doStringify(value[key], level + 1)
      }
      return out + '\n' + parentIndent + '}'
    }

    default:
      throw new Error(`Unsupported value type: ${kind}`)
  }
}

const KEY_RE = /^[A-Za-z0-9_-]+$/
function doKeyStringify(key: string) {
  return KEY_RE.test(key)
    ? key
    : JSON.stringify(key)
}

function getIndent(level: number) {
  return ' '.repeat(2 * level)
}
