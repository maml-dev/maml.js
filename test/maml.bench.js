import { bench, describe } from 'vitest'
import { parse, stringify } from '../build/index.js'
import YAML from 'yaml'
import INI from 'ini'
import TOML from 'toml'
import TOML2 from '@iarna/toml'

const maml = `
{
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

  # Array of objects with nested objects
  examples: [
    {
      json: {
        name: "JSON"
        born: 2001
      }
    }
    {
      maml: {
        name: "MAML"
        born: 2025
      }
    }    
  ]

  notes: """
This is a multiline strings.
Keeps formatting as-is.
"""
}
  `

const obj = {
  "project": "MAML",
  "tags": [
    "minimal",
    "readable"
  ],
  "spec": {
    "version": 1,
    "author": "Anton Medvedev"
  },
  "examples": [
    {
      "json": {
        "name": "JSON",
        "born": 2001
      }
    },
    {
      "maml": {
        "name": "MAML",
        "born": 2025
      }
    }
  ],
  "notes": "This is a multiline strings.\nKeeps formatting as-is.\n"
}

const yaml = YAML.stringify(obj)
const toml = TOML2.stringify(obj)
const ini = INI.stringify(obj)

describe('stringify', () => {
  bench('MAML', () => stringify(obj))
  bench('YAML', () => YAML.stringify(obj))
  bench('INI', () => INI.stringify(obj))
  bench('TOML2', () => TOML2.stringify(obj))
})

describe('parse', () => {
  bench('MAML', () => parse(maml))
  bench('YAML', () => YAML.parse(yaml))
  bench('INI', () => INI.parse(ini))
  bench('TOML', () => TOML.parse(toml))
  bench('TOML2', () => TOML2.parse(toml))
})
