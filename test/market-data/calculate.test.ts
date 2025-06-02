import { DateTime } from 'luxon'
import { axiosCommonHeadersExpectation, testDependencies } from '../setup'
import { expect, it } from 'vitest'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { prepareMarketDataCalculateTest } from './calculate.test.prepare'

it('market data - get historical data', async () => {
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

it('market data - get historical data mocks', async () => {
  const test = await prepareMarketDataCalculateTest()

  const result = await test.execute()

  expect(result.calculateMarketDataRouteTestResult.data).toStrictEqual({
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
