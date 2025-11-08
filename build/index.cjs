"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
}, __copyProps = (to, from, except, desc) => {
  if (from && typeof from == "object" || typeof from == "function")
    for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++)
      key = keys[i], !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, { get: ((k) => from[k]).bind(null, key), enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: !0 }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  parse: () => parse,
  stringify: () => stringify
});
module.exports = __toCommonJS(index_exports);

// src/parse.ts
function parse(source) {
  if (typeof source != "string") throw TypeError("Source must be a string");
  let pos = 0, lineNumber = 1, ch, done = !1;
  next();
  let value = parseValue();
  if (skipWhitespace(), !done)
    throw new SyntaxError(errorSnippet());
  return expectValue(value), value;
  function next() {
    pos < source.length ? (ch = source[pos], pos++) : (ch = "", done = !0), ch === "\n" && lineNumber++;
  }
  function parseValue() {
    var _a, _b, _c, _d, _e, _f, _g;
    return skipWhitespace(), (_g = (_f = (_e = (_d = (_c = (_b = (_a = parseString()) != null ? _a : parseRawString()) != null ? _b : parseNumber()) != null ? _c : parseObject()) != null ? _d : parseArray()) != null ? _e : parseKeyword("true", !0)) != null ? _f : parseKeyword("false", !1)) != null ? _g : parseKeyword("null", null);
  }
  function parseString() {
    if (ch !== '"') return;
    let str = "", escaped = !1;
    for (; ; )
      if (next(), escaped) {
        if (ch === "u") {
          if (next(), ch !== "{")
            throw new SyntaxError(
              errorSnippet(
                errorMap.u + " " + JSON.stringify(ch) + ' (expected "{")'
              )
            );
          let hex = "";
          for (; next(), ch !== "}"; ) {
            if (!isHexDigit(ch))
              throw new SyntaxError(
                errorSnippet(errorMap.u + " " + JSON.stringify(ch))
              );
            if (hex += ch, hex.length > 6)
              throw new SyntaxError(
                errorSnippet(errorMap.u + " (too many hex digits)")
              );
          }
          if (hex.length === 0)
            throw new SyntaxError(errorSnippet(errorMap.u));
          let codePoint = parseInt(hex, 16);
          if (codePoint > 1114111)
            throw new SyntaxError(errorSnippet(errorMap.u + " (out of range)"));
          str += String.fromCodePoint(codePoint);
        } else {
          let escapedChar = escapeMap[ch];
          if (!escapedChar)
            throw new SyntaxError(
              errorSnippet(errorMap.u + " " + JSON.stringify(ch))
            );
          str += escapedChar;
        }
        escaped = !1;
      } else if (ch === "\\")
        escaped = !0;
      else {
        if (ch === '"')
          break;
        if (ch < "")
          throw new SyntaxError(errorSnippet());
        str += ch;
      }
    return next(), str;
  }
  function parseRawString() {
    if (ch !== "`") return;
    let str = "", more = !1;
    do {
      let newline = "\n";
      for (; ; ) {
        if (next(), ch === "\r")
          if (next(), ch === "\n") {
            newline = "\r\n";
            break;
          } else
            str += "\r";
        else if (ch === "\n" || done)
          break;
        str += ch;
      }
      for (next(); isWhitespace(ch); ) next();
      more = ch === "`", more && (str += newline);
    } while (more);
    return str;
  }
  function parseNumber() {
    if (!isDigit(ch) && ch !== "-") return;
    let numStr = "", float = !1;
    if (ch === "-" && (numStr += ch, next(), !isDigit(ch)))
      throw new SyntaxError(errorSnippet());
    if (ch === "0")
      numStr += ch, next();
    else
      for (; isDigit(ch); )
        numStr += ch, next();
    if (ch === ".") {
      if (float = !0, numStr += ch, next(), !isDigit(ch))
        throw new SyntaxError(errorSnippet());
      for (; isDigit(ch); )
        numStr += ch, next();
    }
    if (ch === "e" || ch === "E") {
      if (float = !0, numStr += ch, next(), (ch === "+" || ch === "-") && (numStr += ch, next()), !isDigit(ch))
        throw new SyntaxError(errorSnippet());
      for (; isDigit(ch); )
        numStr += ch, next();
    }
    return float ? parseFloat(numStr) : toSafeNumber(numStr);
  }
  function parseObject() {
    if (ch !== "{") return;
    next(), skipWhitespace();
    let obj = {};
    if (ch === "}")
      return next(), obj;
    for (; ; ) {
      let keyPos = pos, key;
      if (ch === '"' ? key = parseString() : key = parseKey(), Object.prototype.hasOwnProperty.call(obj, key))
        throw pos = keyPos, new SyntaxError(
          errorSnippet("Duplicate key ".concat(JSON.stringify(key)))
        );
      if (skipWhitespace(), ch !== ":")
        throw new SyntaxError(errorSnippet());
      next();
      let value2 = parseValue();
      expectValue(value2), obj[key] = value2;
      let newlineAfterValue = skipWhitespace();
      if (ch === "}")
        return next(), obj;
      if (ch === ",") {
        if (next(), skipWhitespace(), ch === "}")
          return next(), obj;
      } else {
        if (newlineAfterValue)
          continue;
        throw new SyntaxError(
          errorSnippet("Expected comma or newline between key-value pairs")
        );
      }
    }
  }
  function parseKey() {
    let identifier = "";
    for (; isKeyChar(ch); )
      identifier += ch, next();
    if (identifier === "")
      throw new SyntaxError(errorSnippet());
    return identifier;
  }
  function parseArray() {
    if (ch !== "[") return;
    next(), skipWhitespace();
    let array = [];
    if (ch === "]")
      return next(), array;
    for (; ; ) {
      let value2 = parseValue();
      expectValue(value2), array.push(value2);
      let newLineAfterValue = skipWhitespace();
      if (ch === "]")
        return next(), array;
      if (ch === ",") {
        if (next(), skipWhitespace(), ch === "]")
          return next(), array;
      } else {
        if (newLineAfterValue)
          continue;
        throw new SyntaxError(
          errorSnippet("Expected comma or newline between values")
        );
      }
    }
  }
  function parseKeyword(name, value2) {
    if (ch === name[0]) {
      for (let i = 1; i < name.length; i++)
        if (next(), ch !== name[i])
          throw new SyntaxError(errorSnippet());
      if (next(), isWhitespaceOrNewline(ch) || ch === "," || ch === "}" || ch === "]" || ch === void 0)
        return value2;
      throw new SyntaxError(errorSnippet());
    }
  }
  function skipWhitespace() {
    let hasNewline = !1;
    for (; isWhitespaceOrNewline(ch); )
      hasNewline || (hasNewline = ch === "\n"), next();
    let hasNewlineAfterComment = skipComment();
    return hasNewline || hasNewlineAfterComment;
  }
  function skipComment() {
    if (ch === "#") {
      for (; !done && ch !== "\n"; )
        next();
      return skipWhitespace();
    }
    return !1;
  }
  function isWhitespace(ch2) {
    return ch2 === " " || ch2 === "	";
  }
  function isWhitespaceOrNewline(ch2) {
    return ch2 === " " || ch2 === "	" || ch2 === "\n" || ch2 === "\r";
  }
  function isHexDigit(ch2) {
    return ch2 >= "0" && ch2 <= "9" || ch2 >= "A" && ch2 <= "F";
  }
  function isDigit(ch2) {
    return ch2 >= "0" && ch2 <= "9";
  }
  function isKeyChar(ch2) {
    return ch2 >= "A" && ch2 <= "Z" || ch2 >= "a" && ch2 <= "z" || ch2 >= "0" && ch2 <= "9" || ch2 === "_" || ch2 === "-";
  }
  function toSafeNumber(str) {
    if (str == "-0") return -0;
    let num = Number(str);
    return num >= Number.MIN_SAFE_INTEGER && num <= Number.MAX_SAFE_INTEGER ? num : BigInt(str);
  }
  function expectValue(value2) {
    if (value2 === void 0)
      throw new SyntaxError(errorSnippet());
  }
  function errorSnippet(message = "Unexpected character ".concat(JSON.stringify(ch))) {
    ch || (message = "Unexpected end of input");
    let lines = source.substring(pos - 40, pos).split("\n"), lastLine = lines.at(-1) || "", postfix = source.substring(pos, pos + 40).split("\n", 1).at(0) || "";
    lastLine === "" && (lastLine = lines.at(-2) || "", lastLine += " ", lineNumber--, postfix = "");
    let snippet = "    ".concat(lastLine).concat(postfix, "\n"), pointer = "    ".concat(".".repeat(Math.max(0, lastLine.length - 1)), "^\n");
    return "".concat(message, " on line ").concat(lineNumber, ".\n\n").concat(snippet).concat(pointer);
  }
}
var escapeMap = {
  '"': '"',
  "\\": "\\",
  n: "\n",
  r: "\r",
  t: "	"
}, errorMap = {
  u: "Invalid escape sequence"
};

// src/stringify.ts
function stringify(value) {
  return doStringify(value, 0);
}
function doStringify(value, level) {
  let kind = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  switch (kind) {
    case "string":
      return JSON.stringify(value);
    case "boolean":
    case "bigint":
    case "number":
      return "".concat(value);
    case "null":
    case "undefined":
      return "null";
    case "array": {
      let len = value.length;
      if (len === 0) return "[]";
      let childIndent = getIndent(level + 1), parentIndent = getIndent(level), out = "[\n";
      for (let i = 0; i < len; i++)
        i > 0 && (out += "\n"), out += childIndent + doStringify(value[i], level + 1);
      return out + "\n" + parentIndent + "]";
    }
    case "object": {
      let keys = Object.keys(value), len = keys.length;
      if (len === 0) return "{}";
      let childIndent = getIndent(level + 1), parentIndent = getIndent(level), out = "{\n";
      for (let i = 0; i < len; i++) {
        i > 0 && (out += "\n");
        let key = keys[i];
        out += childIndent + doKeyStringify(key) + ": " + doStringify(value[key], level + 1);
      }
      return out + "\n" + parentIndent + "}";
    }
    default:
      throw new Error("Unsupported value type: ".concat(kind));
  }
}
var KEY_RE = /^[A-Za-z0-9_-]+$/;
function doKeyStringify(key) {
  return KEY_RE.test(key) ? key : JSON.stringify(key);
}
function getIndent(level) {
  return " ".repeat(2 * level);
}
//# sourceMappingURL=index.cjs.map
