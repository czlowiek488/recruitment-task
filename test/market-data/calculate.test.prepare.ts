import { DateTime } from 'luxon'
import { testDependencies } from '../setup'
import { StatusCodes } from 'http-status-codes'

export const prepareMarketDataCalculateTest = async () => {
  const mocks = {
    binanceKlinesEndpoint: testDependencies.binanceKlinesEndpoint.mock({
      replyWithError: false,
      query: () => true,
      handler: () => ({
        statusCode: StatusCodes.OK,
        body: [],
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
          },
        })
      return { calculateMarketDataRouteTestResult }
    },
  }
}
