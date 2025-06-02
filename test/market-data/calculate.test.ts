import { DateTime } from 'luxon'
import { axiosCommonHeadersExpectation, testDependencies } from '../setup'
import { expect, it } from 'vitest'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'

it('internal - test 0 > get health check - using axios', async () => {
  const testResult = await testDependencies.calculateMarketDataRoute.test({
    body: {
      symbol: 'BTCUSDT',
      timeStart: DateTime.now().toMillis() - 1_000_000,
      timeEnd: DateTime.now().toMillis(),
    },
  })

  expect(testResult.data).toStrictEqual({
    responseBody: {
      data: {},
      statusCode: StatusCodes.OK,
      statusText: ReasonPhrases.OK,
      succeed: true,
    },
    responseHeaders: axiosCommonHeadersExpectation,
    statusCode: StatusCodes.OK,
  })
})
