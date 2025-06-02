import type { Dependencies } from '../app'
import { Result } from '../shared/lib/result.lib'
import type { FunctionResult } from '../shared/lib/result.lib'

export type BaseIntegration = {
  getHistoricalData: (payload: {
    symbol: string
    startTime: number
    endTime: number
  }) => FunctionResult<Promise<{}>, 'INTEGRATION_CONNECTION_ERROR'>
}

export const baseIntegration = (
  dependencies: Dependencies,
): BaseIntegration => ({
  getHistoricalData: async (payload) => {
    const result = await dependencies.binanceKlinesEndpoint.request({
      body: undefined,
      headers: undefined,
      params: undefined,
      query: {
        interval: '1d',
        symbol: payload.symbol,
        startTime: String(payload.startTime),
        endTime: String(payload.endTime),
      },
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
})
