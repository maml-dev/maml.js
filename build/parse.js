export function parse(source) {
    if (typeof source !== 'string')
        throw TypeError('Source must be a string');
    let pos = 0, lineNumber = 1, ch, done = false;
    next();
    const value = parseValue();
    skipWhitespace();
    if (!done) {
        throw new SyntaxError(errorSnippet());
    }
    expectValue(value);
    return value;
    function next() {
        if (pos < source.length) {
            ch = source[pos];
            pos++;
        }
        else {
            ch = '';
            done = true;
        }
        if (ch === '\n') {
            lineNumber++;
        }
    }
    function lookahead2() {
        return source.substring(pos, pos + 2);
    }
    function parseValue() {
        skipWhitespace();
        return (parseMultilineString() ??
            parseString() ??
            parseNumber() ??
            parseObject() ??
            parseArray() ??
            parseKeyword('true', true) ??
            parseKeyword('false', false) ??
            parseKeyword('null', null));
    }
    function parseString() {
        if (ch !== '"')
            return;
        let str = '';
        let escaped = false;
        while (true) {
            next();
            if (escaped) {
                if (ch === 'u') {
                    let unicode = '';
                    for (let i = 0; i < 4; i++) {
                        next();
                        if (!isHexDigit(ch)) {
                            throw new SyntaxError(errorSnippet(`Invalid Unicode escape sequence`));
                        }
                        unicode += ch;
                    }
                    str += String.fromCharCode(parseInt(unicode, 16));
                }
                else {
                    const escapedChar = {
                        '"': '"',
                        '\\': '\\',
                        '/': '/',
                        b: '\b',
                        f: '\f',
                        n: '\n',
                        r: '\r',
                        t: '\t',
                    }[ch];
                    if (!escapedChar) {
                        throw new SyntaxError(errorSnippet(`Invalid escape sequence ${JSON.stringify(ch)}`));
                    }
                    str += escapedChar;
                }
                escaped = false;
            }
            else if (ch === '\\') {
                escaped = true;
            }
            else if (ch === '"') {
                break;
            }
            else if (ch === '\n') {
                throw new SyntaxError(errorSnippet(`Use """ for multiline strings or escape newlines with "\\n"`));
            }
            else if (ch < '\x1F') {
                throw new SyntaxError(errorSnippet(`Unescaped control character ${JSON.stringify(ch)}`));
            }
            else {
                str += ch;
            }
        }
        next();
        return str;
    }
    function parseMultilineString() {
        if (ch !== '"' || lookahead2() !== '""')
            return;
        next();
        next();
        next();
        let hasLeadingNewline = false;
        if (ch === '\n') {
            hasLeadingNewline = true;
            next();
        }
        let str = '';
        while (!done) {
            if (ch === '"' && lookahead2() === '""') {
                next();
                next();
                next();
                if (str === '' && !hasLeadingNewline) {
                    throw new SyntaxError(errorSnippet('Multiline strings cannot be empty'));
                }
                return str;
            }
            str += ch;
            next();
        }
        throw new SyntaxError(errorSnippet());
    }
    function parseNumber() {
        if (!isDigit(ch) && ch !== '-')
            return;
        let numStr = '';
        if (ch === '-') {
            numStr += ch;
            next();
            if (!isDigit(ch)) {
                throw new SyntaxError(errorSnippet());
            }
        }
        if (ch === '0') {
            numStr += ch;
            next();
        }
        else {
            while (isDigit(ch)) {
                numStr += ch;
                next();
            }
        }
        if (ch === '.') {
            numStr += ch;
            next();
            if (!isDigit(ch)) {
                throw new SyntaxError(errorSnippet());
            }
            while (isDigit(ch)) {
                numStr += ch;
                next();
            }
        }
        if (ch === 'e' || ch === 'E') {
            numStr += ch;
            next();
            if (ch === '+' || ch === '-') {
                numStr += ch;
                next();
            }
            if (!isDigit(ch)) {
                throw new SyntaxError(errorSnippet());
            }
            while (isDigit(ch)) {
                numStr += ch;
                next();
            }
        }
        return isInteger(numStr) ? toSafeNumber(numStr) : parseFloat(numStr);
    }
    function parseObject() {
        if (ch !== '{')
            return;
        next();
        skipWhitespace();
        const obj = {};
        if (ch === '}') {
            next();
            return obj;
        }
        while (true) {
            let key;
            if (ch === '"') {
                key = parseString();
            }
            else {
                key = parseKey();
            }
            skipWhitespace();
            if (ch !== ':') {
                throw new SyntaxError(errorSnippet());
            }
            next();
            const value = parseValue();
            expectValue(value);
            obj[key] = value;
            const newlineAfterValue = skipWhitespace();
            if (ch === '}') {
                next();
                return obj;
            }
            else if (ch === ',') {
                next();
                skipWhitespace();
                if (ch === '}') {
                    next();
                    return obj;
                }
            }
            else if (newlineAfterValue) {
                continue;
            }
            else {
                throw new SyntaxError(errorSnippet('Expected comma or newline between key-value pairs'));
            }
        }
    }
    function parseKey() {
        let identifier = '';
        while (/[A-Za-z0-9_-]/.test(ch)) {
            identifier += ch;
            next();
        }
        if (identifier === '') {
            throw new SyntaxError(errorSnippet());
        }
        return identifier;
    }
    function parseArray() {
        if (ch !== '[')
            return;
        next();
        skipWhitespace();
        const array = [];
        if (ch === ']') {
            next();
            return array;
        }
        while (true) {
            const value = parseValue();
            expectValue(value);
            array.push(value);
            const newLineAfterValue = skipWhitespace();
            if (ch === ']') {
                next();
                return array;
            }
            else if (ch === ',') {
                next();
                skipWhitespace();
                if (ch === ']') {
                    next();
                    return array;
                }
            }
            else if (newLineAfterValue) {
                continue;
            }
            else {
                throw new SyntaxError(errorSnippet('Expected comma or newline between values'));
            }
        }
    }
    function parseKeyword(name, value) {
        if (ch !== name[0])
            return;
        for (let i = 1; i < name.length; i++) {
            next();
            if (ch !== name[i]) {
                throw new SyntaxError(errorSnippet());
            }
        }
        next();
        if (isWhitespace(ch) ||
            ch === ',' ||
            ch === '}' ||
            ch === ']' ||
            ch === undefined) {
            return value;
        }
        throw new SyntaxError(errorSnippet());
    }
    function skipWhitespace() {
        let hasNewline = false;
        while (isWhitespace(ch)) {
            hasNewline ||= ch === '\n';
            next();
        }
        const hasNewlineAfterComment = skipComment();
        return hasNewline || hasNewlineAfterComment;
    }
    function skipComment() {
        if (ch === '#') {
            while (!done && ch !== '\n') {
                next();
            }
            return skipWhitespace();
        }
        return false;
    }
    function isWhitespace(ch) {
        return ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r';
    }
    function isHexDigit(ch) {
        return (ch >= '0' && ch <= '9') || (ch >= 'A' && ch <= 'F');
    }
    function isDigit(ch) {
        return ch >= '0' && ch <= '9';
    }
    function isInteger(value) {
        return /^-?[0-9]+$/.test(value);
    }
    function toSafeNumber(str) {
        if (str == '-0')
            return -0;
        const num = BigInt(str);
        return num >= Number.MIN_SAFE_INTEGER && num <= Number.MAX_SAFE_INTEGER
            ? Number(num)
            : num;
    }
    function expectValue(value) {
        if (value === undefined) {
            throw new SyntaxError(errorSnippet());
        }
    }
    function errorSnippet(message = `Unexpected character ${JSON.stringify(ch)}`) {
        if (!ch)
            message = 'Unexpected end of input';
        const lines = source.substring(pos - 40, pos).split('\n');
        let lastLine = lines.at(-1) || '';
        let postfix = source
            .substring(pos, pos + 40)
            .split('\n', 1)
            .at(0) || '';
        if (lastLine === '') {
            // error at "\n"
            lastLine = lines.at(-2) || '';
            lastLine += ' ';
            lineNumber--;
            postfix = '';
        }
        const snippet = `    ${lastLine}${postfix}\n`;
        const pointer = `    ${'.'.repeat(Math.max(0, lastLine.length - 1))}^\n`;
        return `${message} on line ${lineNumber}.\n\n${snippet}${pointer}`;
    }
}
