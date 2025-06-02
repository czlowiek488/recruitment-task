import AdmZip from 'adm-zip'
import type { StoredData } from './open-api-docs-generator.lib'
import {
  // normalizeString,
  openApiGeneratorGenerate,
} from './open-api-docs-generator.lib'
import type { OpenAPIV3_1 } from 'openapi-types'
import { expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'

// it('normalize string', () => {
//   const str = normalizeString('d426ab55-17b0-4a46-98db-5aa4cbebbe09')

//   expect(str).toStrictEqual('{UUID:V4}')
// })

// it('normalize string object', () => {
//   const str = normalizeObjectStrings({
//     a: {
//       b: { c: { d: { e: [{ x: 'd426ab55-17b0-4a46-98db-5aa4cbebbe09' }] } } },
//     },
//   })

//   expect(str.a.b.c.d.e[0].x).toStrictEqual('{UUID:V4}')
// })

it('stored data should generate correct openapi', () => {
  const filename = fileURLToPath(import.meta.url).replace('.ts', '.zip')
  const zipEntries = new AdmZip(filename).getEntries()
  const storedDataList = zipEntries
    .filter(
      (entry) =>
        entry.isDirectory === false && entry.entryName.endsWith('.json'),
    )
    .sort((entryA, entryB) => entryA.entryName.localeCompare(entryB.entryName))
    .map((entry) => JSON.parse(entry.getData().toString())) as StoredData[]
  const openApiEntry = zipEntries.find((entry) =>
    entry.entryName.endsWith('openapi.yaml'),
  )!
  const expected: OpenAPIV3_1.Document = JSON.parse(
    openApiEntry.getData().toString(),
  )

  const openApi = openApiGeneratorGenerate({
    storedDataList,
    skippedHeaderList: ['user-agent', 'host', 'content-length', 'connection'],
    openApiInfo: {
      title: 'openapi spec generated for testing purpose',
      version: '1.0.0',
      description:
        'this openapi spec should never be used it is only for testing purposes',
    },
  })

  expect(openApi).toStrictEqual({
    openapi: '3.1.0',
    info: {
      title: expect.any(String),
      version: expect.any(String),
      description: expect.any(String),
    },
    paths: expected.paths,
  })
})
