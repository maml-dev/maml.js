export function parse(source: string): any {
  if (typeof source !== 'string') throw TypeError('Source must be a string')

  let pos = 0,
    lineNumber = 1,
    ch: string,
    done = false

  next()
  const value = parseValue()
  skipWhitespace()

  if (!done) {
    throw new SyntaxError(errorSnippet())
  }

  expectValue(value)
  return value

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
  }

  function parseValue(): any {
    skipWhitespace()
    return (
      parseString() ??
      parseRawString() ??
      parseNumber() ??
      parseObject() ??
      parseArray() ??
      parseKeyword('true', true) ??
      parseKeyword('false', false) ??
      parseKeyword('null', null)
    )
  }

  function parseString() {
    if (ch !== '"') return
    let str = ''
    let escaped = false
    while (true) {
      next()
      if (escaped) {
        if ((ch as string) === 'u') {
          next()
          if ((ch as string) !== '{') {
            throw new SyntaxError(
              errorSnippet(
                errorMap.u + ' ' + JSON.stringify(ch) + ' (expected "{")',
              ),
            )
          }
          let hex = ''
          while (true) {
            next()
            if ((ch as string) === '}') break
            if (!isHexDigit(ch)) {
              throw new SyntaxError(
                errorSnippet(errorMap.u + ' ' + JSON.stringify(ch)),
              )
            }
            hex += ch
            if (hex.length > 6) {
              throw new SyntaxError(
                errorSnippet(errorMap.u + ' (too many hex digits)'),
              )
            }
          }
          if (hex.length === 0) {
            throw new SyntaxError(errorSnippet(errorMap.u))
          }
          const codePoint = parseInt(hex, 16)
          if (codePoint > 0x10ffff) {
            throw new SyntaxError(errorSnippet(errorMap.u + ' (out of range)'))
          }
          str += String.fromCodePoint(codePoint)
        } else {
          const escapedChar = escapeMap[ch]
          if (!escapedChar) {
            throw new SyntaxError(
              errorSnippet(errorMap.u + ' ' + JSON.stringify(ch)),
            )
          }
          str += escapedChar
        }
        escaped = false
      } else if ((ch as string) === '\\') {
        escaped = true
      } else if (ch === '"') {
        break
      } else if ((ch as string) === '\n') {
        throw new SyntaxError(
          errorSnippet(
            `Use """ for multiline strings or escape newlines with "\\n"`,
          ),
        )
      } else if ((ch as string) < '\x1F') {
        throw new SyntaxError(
          errorSnippet(`Unescaped control character ${JSON.stringify(ch)}`),
        )
      } else {
        str += ch
      }
    }
    next()
    return str
  }

  function parseRawString() {
    if (ch !== '`') return
    let str = '', more = false
    do {
      while (true) {
        next()
        if ((ch as string) === '\n' || done) break
        str += ch
      }
      next()
      while (isWhitespace(ch)) next()
      more = (ch as string) === '`'
      if (more) str += '\n'
    } while(more)
    return str
  }

  function parseNumber() {
    if (!isDigit(ch) && ch !== '-') return
    let numStr = ''
    let float = false
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
      float = true
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
      float = true
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
    return float ? parseFloat(numStr) : toSafeNumber(numStr)
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
      const keyPos = pos
      let key: string
      if ((ch as string) === '"') {
        key = parseString()!
      } else {
        key = parseKey()
      }
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        pos = keyPos
        throw new SyntaxError(
          errorSnippet(`Duplicate key ${JSON.stringify(key)}`),
        )
      }
      skipWhitespace()
      if ((ch as string) !== ':') {
        throw new SyntaxError(errorSnippet())
      }
      next()
      const value = parseValue()
      expectValue(value)
      obj[key] = value
      const newlineAfterValue = skipWhitespace()
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
      } else if (newlineAfterValue) {
        continue
      } else {
        throw new SyntaxError(
          errorSnippet('Expected comma or newline between key-value pairs'),
        )
      }
    }
  }

  function parseKey() {
    let identifier = ''
    while (isKeyChar(ch)) {
      identifier += ch
      next()
    }
    if (identifier === '') {
      throw new SyntaxError(errorSnippet())
    }
    return identifier
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
      const newLineAfterValue = skipWhitespace()
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
      } else if (newLineAfterValue) {
        continue
      } else {
        throw new SyntaxError(
          errorSnippet('Expected comma or newline between values'),
        )
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
      isWhitespaceOrNewline(ch) ||
      ch === ',' ||
      ch === '}' ||
      ch === ']' ||
      ch === undefined
    ) {
      return value
    }
    throw new SyntaxError(errorSnippet())
  }

  function skipWhitespace(): boolean {
    let hasNewline = false
    while (isWhitespaceOrNewline(ch)) {
      hasNewline ||= ch === '\n'
      next()
    }
    const hasNewlineAfterComment = skipComment()
    return hasNewline || hasNewlineAfterComment
  }

  function skipComment(): boolean {
    if (ch === '#') {
      while (!done && (ch as string) !== '\n') {
        next()
      }
      return skipWhitespace()
    }
    return false
  }

  function isWhitespace(ch: string) {
    return ch === ' ' || ch === '\t'
  }

  function isWhitespaceOrNewline(ch: string) {
    return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r'
  }

  function isHexDigit(ch: string) {
    return (ch >= '0' && ch <= '9') || (ch >= 'A' && ch <= 'F')
  }

  function isDigit(ch: string) {
    return ch >= '0' && ch <= '9'
  }

  function isKeyChar(ch: string) {
    return (
      (ch >= 'A' && ch <= 'Z') ||
      (ch >= 'a' && ch <= 'z') ||
      (ch >= '0' && ch <= '9') ||
      ch === '_' ||
      ch === '-'
    )
  }

  function toSafeNumber(str: string) {
    if (str == '-0') return -0
    const num = Number(str)
    return num >= Number.MIN_SAFE_INTEGER && num <= Number.MAX_SAFE_INTEGER
      ? num
      : BigInt(str)
  }

  function expectValue(value: unknown) {
    if (value === undefined) {
      throw new SyntaxError(errorSnippet())
    }
  }

  function errorSnippet(
    message = `Unexpected character ${JSON.stringify(ch)}`,
  ) {
    if (!ch) message = 'Unexpected end of input'
    const lines = source.substring(pos - 40, pos).split('\n')
    let lastLine = lines.at(-1) || ''
    let postfix =
      source
        .substring(pos, pos + 40)
        .split('\n', 1)
        .at(0) || ''
    if (lastLine === '') {
      // error at "\n"
      lastLine = lines.at(-2) || ''
      lastLine += ' '
      lineNumber--
      postfix = ''
    }
    const snippet = `    ${lastLine}${postfix}\n`
    const pointer = `    ${'.'.repeat(Math.max(0, lastLine.length - 1))}^\n`
    return `${message} on line ${lineNumber}.\n\n${snippet}${pointer}`
  }
}

const escapeMap: Record<string, string> = {
  '"': '"',
  '\\': '\\',
  n: '\n',
  r: '\r',
  t: '\t',
}

const errorMap = {
  u: 'Invalid escape sequence',
}
