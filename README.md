# maml.js

A tiny, modern, well‑tested implementation of the [MAML](https://maml.dev) data format for JavaScript/TypeScript.

- Spec‑accurate parser and pretty serializer
- Zero dependencies, ESM first
- 100% test coverage (statements, branches, lines) verified with Vitest + v8
- Works in Node.js, Deno, Bun and browsers
- Significantly faster than YAML or TOML alternatives, [up to 64x times](./BENCHMARK.md) 
- Only 2kB gzipped

## Installation

```
npm install maml.js
```

Or use the prebuilt bundle [`maml.min.js`](./build/maml.min.js).

## Usage

### Node.js, Deno, Bun

```ts
import { parse, stringify } from 'maml.js'

const data = parse(`{
  project: "MAML"
  tags: [
    "minimal"
    "readable"
  ]

  # A simple nested object
  spec: {
    version: 1
    author: "Anton Medvedev"
  }

  notes: """
This is a multiline string.
Keeps formatting as‑is.
"""
}`)

console.log(data.project) // "MAML"

const text = stringify({ foo: 'bar', list: [1, 2, 3] })
/*
{
  foo: "bar"
  list: [
    1
    2
    3
  ]
}
*/
```

### Browser

```html
<script src="maml.min.js"></script>
<script>
    const obj = MAML.parse('{ answer: 42 }')
    console.log(obj.answer)

    const text = MAML.stringify({ greeting: 'hello' })
    console.log(text)
</script>
```

## License

[MIT](LICENSE)
