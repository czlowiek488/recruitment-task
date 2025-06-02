import { StatusCodes } from 'http-status-codes'
import type { Dependencies } from '../app'
import { Result } from '../shared/lib/result.lib'
import type { FunctionResult } from '../shared/lib/result.lib'

export type BaseIntegration = {
  getGoogle: () => FunctionResult<Promise<{}>, 'INTEGRATION_CONNECTION_ERROR'>
  performTest2: () => FunctionResult<
    Promise<{}>,
    'INTEGRATION_INVALID_STATUS_CODE_ERROR' | 'INTEGRATION_CONNECTION_ERROR'
  >
}

export const baseIntegration = (
  dependencies: Dependencies,
): BaseIntegration => ({
  getGoogle: async () => {
    const result = await dependencies.googleEndpoint.request({
      body: undefined,
      headers: undefined,
      params: undefined,
      query: undefined,
    })
    if (result.statusCode === undefined) {
      return new Result(
        false,
        'integration could not send request because of network failure',
        {},
        'INTEGRATION_CONNECTION_ERROR',
      )
    }
    return new Result(true, 'integration request succeed', {})
  },
  performTest2: async () => {
    const result = await dependencies.test2Endpoint.request({
      body: { testRequestDataKey: 'testRequestDataValue' },
      headers: { testRequestHeaderKey: 'testRequestHeaderValue' },
      params: { testRequestParamsKey: 'testRequestParamsValue' },
      query: { testRequestQueryKey: 'testRequestQueryValue' },
    })
    if (result.statusCode === undefined) {
      return new Result(
        false,
        'integration could not send request because of network failure',
        {},
        'INTEGRATION_CONNECTION_ERROR',
      )
    }
    if (result.statusCode !== StatusCodes.OK) {
      return new Result(
        false,
        'integration could not send request because of network failure',
        {},
        'INTEGRATION_INVALID_STATUS_CODE_ERROR',
        result,
      )
    }
    return new Result(true, 'integration request succeed', {})
  },
})
