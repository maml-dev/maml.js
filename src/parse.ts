export function parse(source: string): any {
  if (typeof source !== 'string') throw TypeError('source must be a string')

  let pos = 0,
    lineNumber = 1,
    buffer = '',
    ch: string,
    done = false

  function next() {
    if (pos < source.length) {
      ch = source[pos]
      pos++
    } else {
      ch = ''
      done = true
    }
    if (ch === '\n') {
      lineNumber++
    }
    buffer += ch
    if (buffer.length > 100) {
      buffer = buffer.slice(-40)
    }
  }

  next()
  while (!done) {
    const value = parseValue()
    expectValue(value)
    return value
  }

  function parseValue(): any {
    skipWhitespace()
    const value =
      parseString() ??
      parseNumber() ??
      parseObject() ??
      parseArray() ??
      parseKeyword('true', true) ??
      parseKeyword('false', false) ??
      parseKeyword('null', null)
    skipWhitespace()
    return value
  }

  function parseString() {
    if (ch !== '"') return
    let str = ''
    let escaped = false
    while (true) {
      next()
      if (escaped) {
        if ((ch as string) === 'u') {
          let unicode = ''
          for (let i = 0; i < 4; i++) {
            next()
            if (!isHexDigit(ch)) {
              throw new SyntaxError(
                errorSnippet(
                  `Invalid Unicode escape sequence '\\u${unicode}${ch}'`,
                ),
              )
            }
            unicode += ch
          }
          str += String.fromCharCode(parseInt(unicode, 16))
        } else {
          const escapedChar = {
            '"': '"',
            '\\': '\\',
            '/': '/',
            b: '\b',
            f: '\f',
            n: '\n',
            r: '\r',
            t: '\t',
          }[ch]
          if (!escapedChar) {
            throw new SyntaxError(errorSnippet())
          }
          str += escapedChar
        }
        escaped = false
      } else if ((ch as string) === '\\') {
        escaped = true
      } else if (ch === '"') {
        break
      } else if ((ch as string) < '\x1F') {
        throw new SyntaxError(
          errorSnippet(`Unescaped control character ${JSON.stringify(ch)}`),
        )
      } else if (ch === undefined) {
        throw new SyntaxError(errorSnippet())
      } else {
        str += ch
      }
    }
    next()
    return str
  }

  function parseNumber() {
    if (!isDigit(ch) && ch !== '-') return
    let numStr = ''
    if (ch === '-') {
      numStr += ch
      next()
      if (!isDigit(ch)) {
        throw new SyntaxError(errorSnippet())
      }
    }
    if (ch === '0') {
      numStr += ch
      next()
    } else {
      while (isDigit(ch)) {
        numStr += ch
        next()
      }
    }
    if (ch === '.') {
      numStr += ch
      next()
      if (!isDigit(ch)) {
        throw new SyntaxError(errorSnippet())
      }
      while (isDigit(ch)) {
        numStr += ch
        next()
      }
    }
    if (ch === 'e' || ch === 'E') {
      numStr += ch
      next()
      if ((ch as string) === '+' || (ch as string) === '-') {
        numStr += ch
        next()
      }
      if (!isDigit(ch)) {
        throw new SyntaxError(errorSnippet())
      }
      while (isDigit(ch)) {
        numStr += ch
        next()
      }
    }
    return isInteger(numStr) ? toSafeNumber(numStr) : parseFloat(numStr)
  }

  function parseObject() {
    if (ch !== '{') return
    next()
    skipWhitespace()
    const obj: Record<string, any> = {}
    if ((ch as string) === '}') {
      next()
      return obj
    }
    while (true) {
      if ((ch as string) !== '"') {
        throw new SyntaxError(errorSnippet())
      }
      const key = parseString()
      if (key === undefined) {
        throw new SyntaxError(errorSnippet())
      }
      skipWhitespace()
      if ((ch as string) !== ':') {
        throw new SyntaxError(errorSnippet())
      }
      next()
      const value = parseValue()
      expectValue(value)
      obj[key] = value
      skipWhitespace()
      if ((ch as string) === '}') {
        next()
        return obj
      } else if ((ch as string) === ',') {
        next()
        skipWhitespace()
        if ((ch as string) === '}') {
          next()
          return obj
        }
      } else {
        throw new SyntaxError(errorSnippet())
      }
    }
  }

  function parseArray() {
    if (ch !== '[') return
    next()
    skipWhitespace()
    const array: any[] = []
    if ((ch as string) === ']') {
      next()
      return array
    }
    while (true) {
      const value = parseValue()
      expectValue(value)
      array.push(value)
      skipWhitespace()
      if ((ch as string) === ']') {
        next()
        return array
      } else if ((ch as string) === ',') {
        next()
        skipWhitespace()
        if ((ch as string) === ']') {
          next()
          return array
        }
      } else {
        throw new SyntaxError(errorSnippet())
      }
    }
  }

  function parseKeyword<T>(name: string, value: T) {
    if (ch !== name[0]) return
    for (let i = 1; i < name.length; i++) {
      next()
      if (ch !== name[i]) {
        throw new SyntaxError(errorSnippet())
      }
    }
    next()
    if (
      isWhitespace(ch) ||
      ch === ',' ||
      ch === '}' ||
      ch === ']' ||
      ch === undefined
    ) {
      return value
    }
    throw new SyntaxError(errorSnippet())
  }

  function skipWhitespace() {
    while (isWhitespace(ch)) {
      next()
    }
    skipComment()
  }

  function skipComment() {
    if (ch === '#') {
      while (!done && (ch as string) !== '\n') {
        next()
      }
      skipWhitespace()
    }
  }

  function isWhitespace(ch: string) {
    return ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r'
  }

  function isHexDigit(ch: string) {
    return (
      (ch >= '0' && ch <= '9') ||
      (ch >= 'a' && ch <= 'f') ||
      (ch >= 'A' && ch <= 'F')
    )
  }

  function isDigit(ch: string) {
    return ch >= '0' && ch <= '9'
  }

  function isInteger(value: string) {
    return /^-?[0-9]+$/.test(value)
  }

  function toSafeNumber(str: string) {
    if (str == '-0') return -0
    const num = BigInt(str)
    return num >= Number.MIN_SAFE_INTEGER && num <= Number.MAX_SAFE_INTEGER
      ? Number(num)
      : num
  }

  function expectValue(value: unknown) {
    if (value === undefined) {
      throw new SyntaxError(errorSnippet(`JSON value expected`))
    }
  }

  function errorSnippet(message = `Unexpected character '${ch}'`) {
    if (!ch) {
      message = 'Unexpected end of input'
    }
    const lines = buffer.slice(-40).split('\n')
    const lastLine = lines.pop()!
    const source =
      lines.map((line) => `    ${line}\n`).join('') + `    ${lastLine}\n`
    const p = `    ${'.'.repeat(Math.max(0, lastLine.length - 1))}^\n`
    return `${message} on line ${lineNumber}.\n\n${source}${p}`
  }
}
