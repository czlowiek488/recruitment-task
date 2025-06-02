import type { Dependencies } from '../app'
import { logger } from '../shared/lib/logger.lib'
import { Result } from '../shared/lib/result.lib'
import type { FunctionResult } from '../shared/lib/result.lib'
import type { BinanceIntervalCharacter } from './binance.integration.endpoint'

export type BinanceIntegration = {
  getHistoricalData: (payload: {
    symbol: string
    startTime: number
    endTime: number
    interval: BinanceIntervalCharacter
  }) => FunctionResult<
    Promise<{
      changeList: {
        openPrice: number
        closePrice: number
        volume: number
        openTime: number
        closeTime: number
        numberOfTrades: number
      }[]
    }>,
    'INTEGRATION_CONNECTION_ERROR' | 'INTEGRATION_BINANCE_NO_KLINE_DATA_ERROR'
  >
}

export const binanceIntegration = (
  dependencies: Dependencies,
): BinanceIntegration => ({
  getHistoricalData: async (payload) => {
    const result = await dependencies.binanceKlinesEndpoint.request({
      body: undefined,
      headers: undefined,
      params: undefined,
      query: {
        interval: `1${payload.interval}`,
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
    if (result.body[0] === undefined) {
      return new Result(
        false,
        'integration binance no kline data',
        {},
        'INTEGRATION_BINANCE_NO_KLINE_DATA_ERROR',
      )
    }
    logger.debug('here', result.body[0])
    return new Result(true, 'integration request succeed', {
      changeList: result.body.map((entry) => ({
        openPrice: Number(entry[1]),
        closePrice: Number(entry[2]),
        volume: Number(entry[5]),
        openTime: entry[0],
        closeTime: entry[6],
        numberOfTrades: Number(entry[9]),
      })),
    })
  },
})
