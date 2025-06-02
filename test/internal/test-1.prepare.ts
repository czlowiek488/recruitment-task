import { StatusCodes } from 'http-status-codes'
import type { Dependencies } from '../../src/app'
import { assureConfig } from '../setup'

export type PreparePayload = {
  counter: number
}

export const prepareInternalTest1 =
  (dependencies: Dependencies) => async (payload: PreparePayload) => {
    const state: {} = {}
    const mocks = {
      googleEndpoint: dependencies.googleEndpoint.mock({
        replyWithError: false,
        handler: () => ({
          statusCode: StatusCodes.OK,
          body: 'DONE',
          headers: undefined,
        }),
      }),
    }
    const assureConfigResult = await assureConfig({})
    if (assureConfigResult.succeed === false) {
      throw assureConfigResult.destroyToThrow()
    }
    return {
      state,
      payload,
      mocks,
      execute: async () => {
        const postBaseResult = await dependencies.internalTest1Route.test({
          body: { counter: payload.counter },
        })
        return {
          postBaseResult,
        }
      },
    }
  }
