export function stringify(value: any): string {
  return doStringify(value, 0)
}

function doStringify(value: any, level: number): string {
  const kind =
    value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value

  switch (kind) {
    case 'string':
      return quoteString(value)

    case 'boolean':
      return `${value}`

    case 'bigint': {
      const I64_MIN = -(2n ** 63n)
      const I64_MAX = 2n ** 63n - 1n
      if (value < I64_MIN || value > I64_MAX) {
        throw new Error(
          `Integer ${value} is outside the 64-bit signed integer range`,
        )
      }
      return `${value}`
    }

    case 'number': {
      if (!Number.isFinite(value)) {
        throw new Error(`Cannot encode ${value} as a MAML value`)
      }
      const str = `${value}`
      // If the string representation looks like an integer (no '.' or 'e'),
      // it must be a safe integer to avoid silent precision loss
      if (
        !str.includes('.') &&
        !str.includes('e') &&
        !Number.isSafeInteger(value)
      ) {
        throw new Error(
          `Integer ${value} cannot be represented losslessly as a number, use BigInt instead`,
        )
      }
      return str
    }

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
        out +=
          childIndent +
          doKeyStringify(key) +
          ': ' +
          doStringify(value[key], level + 1)
      }
      return out + '\n' + parentIndent + '}'
    }

    default:
      throw new Error(`Unsupported value type: ${kind}`)
  }
}

function quoteString(s: string): string {
  let out = '"'
  for (const c of s) {
    const code = c.codePointAt(0)!
    if (c === '"') out += '\\"'
    else if (c === '\\') out += '\\\\'
    else if (c === '\n') out += '\\n'
    else if (c === '\r') out += '\\r'
    else if (c === '\t') out += '\\t'
    else if (code < 0x20 || code === 0x7f)
      out += `\\u{${code.toString(16).toUpperCase()}}`
    else out += c
  }
  return out + '"'
}

const KEY_RE = /^[A-Za-z0-9_-]+$/
function doKeyStringify(key: string) {
  return KEY_RE.test(key) ? key : quoteString(key)
}

function getIndent(level: number) {
  return ' '.repeat(2 * level)
}
