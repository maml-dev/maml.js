import fs from 'node:fs/promises'
import path from 'node:path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const root = path.resolve(__dirname, '..')

const pkgJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'))
const whitelist = new Set([
  'name',
  'version',
  'description',
  'publishConfig',
  'keywords',
  'repository',
  'homepage',
  'author',
  'license',
])
const {name, version, description, ...rest} = Object.fromEntries(Object.entries(pkgJson).filter(([k]) => whitelist.has(k)))

const pkgCjs = {
  name,
  version: version + '-cjs',
  description,
  main: 'build/index.cjs',
  types: 'build/index.d.ts',
  files: [
    'build/index.cjs',
    'build/*.d.ts'
  ],
  engines: {
    node: '>=6'
  },
  ...rest,
}

const pkgEsm = {
  name,
  version,
  description,
  exports: 'build/index.js',
  types: 'build/index.d.ts',
  files: [
    'build/index.js',
    'build/*.d.ts'
  ],
  engines: {
    node: '>=12'
  },
  ...rest,
}

await fs.writeFile(path.join(root, 'package-cjs.json'), JSON.stringify(pkgCjs, null, 2))
await fs.writeFile(path.join(root, 'package-esm.json'), JSON.stringify(pkgEsm, null, 2))
