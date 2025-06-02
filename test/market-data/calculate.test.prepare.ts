import { DateTime } from 'luxon'
import { testDependencies } from '../setup'
import { StatusCodes } from 'http-status-codes'
import { BinanceIntervalCharacter } from '../../src/integration/binance.integration.endpoint'

export const prepareMarketDataCalculateTest = async (payload: {
  noData?: boolean
  interval?: BinanceIntervalCharacter
}) => {
  const mocks = {
    binanceKlinesEndpoint: testDependencies.binanceKlinesEndpoint.mock({
      replyWithError: false,
      query: () => true,
      handler: () => ({
        statusCode: StatusCodes.OK,
        body:
          payload.noData === true
            ? []
            : [
                [
                  1748863260000,
                  '100000.0000000',
                  '100100.0000000',
                  '104261.74000000',
                  '104261.74000000',
                  '2.16946000',
                  1748863319999,
                  '226224.74800220',
                  59,
                  '0.00059000',
                  '61.52235180',
                  '0',
                ],
              ],
        headers: undefined,
      }),
    }),
  }

  return {
    mocks,
    execute: async () => {
      const calculateMarketDataRouteTestResult =
        await testDependencies.calculateMarketDataRoute.test({
          body: {
            symbol: 'BTCUSDT',
            timeStart: DateTime.now().toMillis() - 1_000_000,
            timeEnd: DateTime.now().toMillis(),
            interval: payload.interval || BinanceIntervalCharacter.m,
          },
        })
      return { calculateMarketDataRouteTestResult }
    },
  }
}
