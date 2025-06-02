import { StatusCodes } from 'http-status-codes'
import type { DatabaseName } from '../../src/shared/enum/database-name.enum'
import type { Config } from '../../src/app.config'
import { assureConfig } from '../setup'
import type { TestDependencies } from '../setup'
import { Result } from '../../src/shared/lib/result.lib'

type PreparePayload = {
  counter: number
  databaseType: DatabaseName
  replyWithError: boolean
  config: Partial<Config>
}

export const prepareInternalTest2 =
  (dependencies: TestDependencies) => async (payload: PreparePayload) => {
    const state: { counterId: string; oldEnvVariable: NodeJS.ProcessEnv } = <
      any
    >{}
    const assureConfigResult = await assureConfig(payload.config)
    if (assureConfigResult.succeed === false) {
      throw assureConfigResult.destroyToThrow()
    }
    const mocks = {
      test2Endpoint: dependencies.test2Endpoint.mock({
        replyWithError: payload.replyWithError,
        query: { testRequestQueryKey: 'testRequestQueryValue' },
        handler: () => ({
          statusCode: StatusCodes.OK,
          body: { testResponseDataKey: 'testResponseDataValue' },
          headers: {
            testResponseHeaderKey: 'testResponseHeaderValue',
          },
        }),
      }),
      googleEndpoint: dependencies.googleEndpoint.mock({
        replyWithError: false,
        handler: () => ({
          statusCode: StatusCodes.OK,
          body: 'DONE',
          headers: undefined,
        }),
      }),
    }
    return {
      state,
      payload,
      mocks,
      execute: async () => {
        const postBaseResult = await dependencies.internalTest1Route.test({
          body: { counter: payload.counter },
        })
        if (postBaseResult.data.statusCode !== StatusCodes.OK) {
          throw new Result(
            false,
            'test execution failed',
            postBaseResult,
            'TEST_EXECUTION_ERROR',
          ).destroyToThrow()
        }
        state.counterId = postBaseResult.data.responseBody.data?.counterId
        const internalTest2Result = await dependencies.internalTest2Route.test({
          params: {
            counterId: postBaseResult.data.responseBody.data?.counterId,
          },
          query: { databaseType: payload.databaseType },
        })

        return {
          postBaseResult,
          internalTest2Result,
        }
      },
    }
  }
