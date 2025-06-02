/* eslint-disable no-restricted-globals */
/* eslint-disable dot-notation, no-console */
import { config } from 'dotenv'
import { realpathSync, existsSync } from 'fs'
import { resolve } from 'path'
import type { Config } from '../../app.config'

//! use bracket notation to ignore this usage of process["env"] and console["log"] in search

export const exists = (rootDir: string, relativePath: string): boolean =>
  existsSync(resolve(rootDir, relativePath))

const rootDir = realpathSync(process.cwd())

const envFile: { envTest: boolean; env: boolean; envExample: boolean } = {
  envTest: exists(rootDir, '.env.test'),
  env: exists(rootDir, '.env'),
  envExample: exists(rootDir, '.env.example'),
}
let variables: NodeJS.ProcessEnv | null = null

if (process['env'].APP_STAGE === 'test' && envFile.envTest) {
  config({ path: './.env.test' })
  variables = process['env']
}
if (process['env'].APP_STAGE !== 'test' && envFile.env) {
  console['log']('Using .env file to supply config environment variables')
  config()
  variables = process['env']
}
if (process['env'].APP_STAGE !== 'production' && envFile.envExample) {
  console['log'](
    'Using .env.example file to supply config environment variables',
  )
  config({ path: '.env.example' })
  variables = process['env']
}

if (variables === null) {
  throw new Error(
    '\n>>>>>>>>>>>> application could not lod env variables <<<<<<<<<<<<<\n',
  )
}
export const envVariables = variables

export const setEnvVariables = (env: Config) => {
  Object.assign(envVariables, env)
}
