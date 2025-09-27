export function parse(source: string): any {
  if (typeof source !== 'string') throw TypeError('source must be a string')

  let pos = 0, lineNumber = 1, buffer = '', lastChar: string, done = false

  function next() {
    if (pos < source.length) {
      lastChar = source[pos]
      pos++
    } else {
      lastChar = ''
      done = true
    }
    if (lastChar === '\n') {
      lineNumber++
    }
    buffer += lastChar
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
    if (lastChar !== '"') return
    let str = ''
    let escaped = false
    while (true) {
      next()
      if (escaped) {
        if (lastChar as string === 'u') {
          let unicode = ''
          for (let i = 0; i < 4; i++) {
            next()
            if (!isHexDigit(lastChar)) {
              throw new SyntaxError(errorSnippet(`Invalid Unicode escape sequence '\\u${unicode}${lastChar}'`))
            }
            unicode += lastChar
          }
          str += String.fromCharCode(parseInt(unicode, 16))
        } else {
          const escapedChar = {
            '"': '"',
            '\\': '\\',
            '/': '/',
            'b': '\b',
            'f': '\f',
            'n': '\n',
            'r': '\r',
            't': '\t',
          }[lastChar]
          if (!escapedChar) {
            throw new SyntaxError(errorSnippet())
          }
          str += escapedChar
        }
        escaped = false
      } else if (lastChar as string === '\\') {
        escaped = true
      } else if (lastChar === '"') {
        break
      } else if ((lastChar as string) < '\x1F') {
        throw new SyntaxError(errorSnippet(`Unescaped control character ${JSON.stringify(lastChar)}`))
      } else if (lastChar === undefined) {
        throw new SyntaxError(errorSnippet())
      } else {
        str += lastChar
      }
    }
    next()
    return str
  }

  function parseNumber() {
    if (!isDigit(lastChar) && lastChar !== '-') return
    let numStr = ''
    if (lastChar === '-') {
      numStr += lastChar
      next()
      if (!isDigit(lastChar)) {
        throw new SyntaxError(errorSnippet())
      }
    }
    if (lastChar === '0') {
      numStr += lastChar
      next()
    } else {
      while (isDigit(lastChar)) {
        numStr += lastChar
        next()
      }
    }
    if (lastChar === '.') {
      numStr += lastChar
      next()
      if (!isDigit(lastChar)) {
        throw new SyntaxError(errorSnippet())
      }
      while (isDigit(lastChar)) {
        numStr += lastChar
        next()
      }
    }
    if (lastChar === 'e' || lastChar === 'E') {
      numStr += lastChar
      next()
      if (lastChar as string === '+' || lastChar as string === '-') {
        numStr += lastChar
        next()
      }
      if (!isDigit(lastChar)) {
        throw new SyntaxError(errorSnippet())
      }
      while (isDigit(lastChar)) {
        numStr += lastChar
        next()
      }
    }
    return isInteger(numStr) ? toSafeNumber(numStr) : parseFloat(numStr)
  }

  function parseObject() {
    if (lastChar !== '{') return
    next()
    skipWhitespace()
    const obj: Record<string, any> = {}
    if (lastChar as string === '}') {
      next()
      return obj
    }
    while (true) {
      if (lastChar as string !== '"') {
        throw new SyntaxError(errorSnippet())
      }
      const key = parseString()
      if (key === undefined) {
        throw new SyntaxError(errorSnippet())
      }
      skipWhitespace()
      if (lastChar as string !== ':') {
        throw new SyntaxError(errorSnippet())
      }
      next()
      const value = parseValue()
      expectValue(value)
      obj[key] = value
      skipWhitespace()
      if (lastChar as string === '}') {
        next()
        return obj
      } else if (lastChar as string === ',') {
        next()
        skipWhitespace()
        if (lastChar as string === '}') {
          next()
          return obj
        }
      } else {
        throw new SyntaxError(errorSnippet())
      }
    }
  }

  function parseArray() {
    if (lastChar !== '[') return
    next()
    skipWhitespace()
    const array: any[] = []
    if (lastChar as string === ']') {
      next()
      return array
    }
    while (true) {
      const value = parseValue()
      expectValue(value)
      array.push(value)
      skipWhitespace()
      if (lastChar as string === ']') {
        next()
        return array
      } else if (lastChar as string === ',') {
        next()
        skipWhitespace()
        if (lastChar as string === ']') {
          next()
          return array
        }
      } else {
        throw new SyntaxError(errorSnippet())
      }
    }
  }

  function parseKeyword<T>(name: string, value: T) {
    if (lastChar !== name[0]) return
    for (let i = 1; i < name.length; i++) {
      next()
      if (lastChar !== name[i]) {
        throw new SyntaxError(errorSnippet())
      }
    }
    next()
    if (isWhitespace(lastChar) || lastChar === ',' || lastChar === '}' || lastChar === ']' || lastChar === undefined) {
      return value
    }
    throw new SyntaxError(errorSnippet())
  }

  function skipWhitespace() {
    while (isWhitespace(lastChar)) {
      next()
    }
    skipComment()
  }

  function skipComment() {
    if (lastChar === '#') {
      while (!done && lastChar as string !== '\n') {
        next()
      }
      skipWhitespace()
    }
  }

  function isWhitespace(ch: string) {
    return ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r'
  }

  function isHexDigit(ch: string) {
    return (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F')
  }

  function isDigit(ch: string) {
    return ch >= '0' && ch <= '9'
  }

  function isInteger(value: string) {
    return /^-?[0-9]+$/.test(value)
  }

  function toSafeNumber(str: string) {
    if (str == '-0') return -0
    const maxSafeInteger = Number.MAX_SAFE_INTEGER
    const minSafeInteger = Number.MIN_SAFE_INTEGER
    const num = BigInt(str)
    return num >= minSafeInteger && num <= maxSafeInteger ? Number(num) : num
  }

  function expectValue(value: unknown) {
    if (value === undefined) {
      throw new SyntaxError(errorSnippet(`JSON value expected`))
    }
  }

  function errorSnippet(message = `Unexpected character '${lastChar}'`) {
    if (!lastChar) {
      message = 'Unexpected end of input'
    }
    const lines = buffer.slice(-40).split('\n')
    const lastLine = lines.pop()!
    const source =
      lines.map(line => `    ${line}\n`).join('')
      + `    ${lastLine}\n`
    const p = `    ${'.'.repeat(Math.max(0, lastLine.length - 1))}^\n`
    return `${message} on line ${lineNumber}.\n\n${source}${p}`
  }
}
