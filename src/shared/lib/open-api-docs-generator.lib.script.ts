import { writeFileSync } from 'fs'
import {
  openApiGeneratorGenerate,
  readDirectoryStoredDataFiles,
} from './open-api-docs-generator.lib'
import { envVariables } from './dotenv.lib'
import { prettyJsonParser } from '../parser/pretty-json.parser'
import { logger } from './logger.lib'
logger.notice('lib open api docs starting generation...')
const openApi = openApiGeneratorGenerate({
  storedDataList: readDirectoryStoredDataFiles({
    directoryPath: envVariables.OPEN_API_PATH!,
  }),
  skippedHeaderList: ['user-agent', 'host', 'content-length', 'connection'],
  openApiInfo: {
    title: 'Starter Esm - Starter for modern Node.js applications',
    version: '1.0.0',
    description: ``,
  },
})
logger.notice('lib open api docs generated, saving...')

writeFileSync('./temp/openapi.yaml', prettyJsonParser(openApi))

logger.notice('lib open api docs saved, script finished')
