import { cleanAll, disableNetConnect, enableNetConnect } from 'nock'
import { afterAll, beforeAll, beforeEach, expect } from 'vitest'
import { AppEnv } from '../src/shared/enum/app-env.enum'
import { asFunction, createContainer } from 'awilix'
import { prepareInternalTest1 } from './internal/test-1.prepare'
import { prepareInternalTest2 } from './internal/test-2.prepare'
import { loadAppContainer } from '../src/app'
import type { Dependencies } from '../src/app'
import type { Config } from '../src/app.config'
import { Result } from '../src/shared/lib/result.lib'
import type { FunctionResult } from '../src/shared/lib/result.lib'
import { envVariables } from '../src/shared/lib/dotenv.lib'
import { logger } from '../src/shared/lib/logger.lib'

export type TestDependencies = Dependencies & {
  prepareInternalTest1: ReturnType<typeof prepareInternalTest1>
  prepareInternalTest2: ReturnType<typeof prepareInternalTest2>
}
export const testContainer = createContainer<TestDependencies>()
  .register({
    prepareInternalTest1: asFunction(prepareInternalTest1),
    prepareInternalTest2: asFunction(prepareInternalTest2),
  })
  .createScope()
const mainContainer = loadAppContainer(envVariables, testContainer)
if (mainContainer.succeed === false) {
  throw mainContainer.destroyToThrow()
}
export let testDependencies = mainContainer.data.cradle
const state = {
  originalConfig: { ...testDependencies.config },
}
export const assureConfig = async (
  env: Partial<Config>,
): FunctionResult<Promise<{}>, 'TEST_ASSURING_CONFIG_ERROR'> => {
  const newConfig = {
    ...state.originalConfig,
    ...env,
  }
  const isDifference =
    Object.keys(state.originalConfig) !== Object.keys(env) ||
    Object.entries(newConfig).some(
      ([key, value]) => testDependencies.config[key as keyof Config] !== value,
    )
  if (isDifference === false) {
    return new Result(true, 'test assure config no difference', {})
  }
  const reloadResult = await testDependencies.appManager.reloadApp(
    { ...envVariables, ...env, VALIDATE_CONFIG: false } as Config,
    testContainer,
  )
  if (reloadResult.succeed === false) {
    return new Result(
      false,
      'test assuring config failed',
      { env },
      'TEST_ASSURING_CONFIG_ERROR',
      reloadResult,
    )
  }
  testDependencies = reloadResult.data.cradle
  return new Result(true, 'test assure config app reloaded', {})
}

const naiveParseHostname = (host?: string): string =>
  host === undefined
    ? ''
    : host
        .replace(new RegExp('[(http)(https)]://'), '')
        .split('/')[0]!
        .split(':')[0]!

beforeAll(async () => {
  const allowedHostList = ['127.0.0.1']
  if (testDependencies.config.APP_ENV === AppEnv.docker) {
    const getHostNamesResult = await testDependencies.dbManager.getHostNames()
    if (getHostNamesResult.succeed === false) {
      logger.notice('beforeAllError', getHostNamesResult.normalizeCauseList())
      throw getHostNamesResult.destroyToThrow()
    }
    allowedHostList.push(...getHostNamesResult.data.map(naiveParseHostname))
  }
  allowedHostList.push('testnet.binance.vision')
  disableNetConnect()
  enableNetConnect((host) => {
    const result = allowedHostList.includes(naiveParseHostname(host))
    if (result === false) {
      logger.crit('disallowing network connection', { result, host })
    }
    return result
  })
  const startAppResult = await testDependencies.appManager.startApp()
  if (startAppResult.succeed === false) {
    logger.notice('beforeAllError', startAppResult.normalizeCauseList())
    throw startAppResult.destroyToThrow()
  }
  // const runMigrationsResult = await testDependencies.dbManager.runMigrations()
  // if (runMigrationsResult.succeed === false) {
  //   logger.notice('beforeAllError', runMigrationsResult.normalizeCauseList())
  //   throw runMigrationsResult
  // }
})

export const axiosCommonHeadersExpectation = {
  connection: 'close',
  'content-length': expect.any(String),
  'content-type': expect.any(String),
  date: expect.any(String),
  etag: expect.any(String),
  'x-powered-by': 'Express',
}

beforeEach(async () => {
  cleanAll()
  const result = await testDependencies.dbManager.emptyDatabases()
  if (result.succeed === false) {
    logger.notice('beforeEach', result.normalizeCauseList())
    throw result.destroyToThrow()
  }
})

afterAll(async () => {
  const result = await testDependencies.appManager.closeApp()
  if (result.succeed === false) {
    logger.notice('afterAll', result.normalizeCauseList())
    throw result.destroyToThrow()
  }
})
