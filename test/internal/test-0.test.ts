import { expect, it } from 'vitest'
import { axiosCommonHeadersExpectation, testDependencies } from '../setup'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import axios from 'axios'
import { DatabaseName } from '../../src/shared/enum/database-name.enum'

it('internal - test 0 > get health check - using axios', async () => {
  const testResult = await axios({
    method: testDependencies.healthCheckGetRoute.method,
    url: `http://127.0.0.1:${testDependencies.config.APP_PORT}${testDependencies.healthCheckGetRoute.path}`,
  })
  expect(testResult.status).toStrictEqual(StatusCodes.OK)
  expect(testResult.statusText).toStrictEqual(ReasonPhrases.OK)
  expect(Object.fromEntries(Object.entries(testResult.headers))).toStrictEqual({
    ...axiosCommonHeadersExpectation,
    health_check_time_start: expect.any(String),
    health_check_time_end: expect.any(String),
  })
  expect(testResult.data).toStrictEqual({
    data: {},
    statusCode: StatusCodes.OK,
    statusText: ReasonPhrases.OK,
    succeed: true,
  })
})

it('internal - test 0 > get health check - using dependencies axios', async () => {
  const testResult = await testDependencies.axios({
    method: testDependencies.healthCheckGetRoute.method,
    url: `http://127.0.0.1:${testDependencies.config.APP_PORT}${testDependencies.healthCheckGetRoute.path}`,
  })
  expect(testResult.status).toStrictEqual(StatusCodes.OK)
  expect(testResult.statusText).toStrictEqual(ReasonPhrases.OK)
  expect(Object.fromEntries(Object.entries(testResult.headers))).toStrictEqual({
    ...axiosCommonHeadersExpectation,
    health_check_time_start: expect.any(String),
    health_check_time_end: expect.any(String),
  })
  expect(testResult.data).toStrictEqual({
    data: {},
    statusCode: StatusCodes.OK,
    statusText: ReasonPhrases.OK,
    succeed: true,
  })
})

it('internal - test 0 > get health check - using route', async () => {
  const testResult = await testDependencies.healthCheckGetRoute.test({
    headers: {},
  })
  expect(testResult.data).toStrictEqual({
    responseBody: {
      data: {},
      statusCode: StatusCodes.OK,
      statusText: ReasonPhrases.OK,
      succeed: true,
    },
    responseHeaders: {
      ...axiosCommonHeadersExpectation,
      health_check_time_start: expect.any(String),
      health_check_time_end: expect.any(String),
    },
    statusCode: StatusCodes.OK,
  })
})

it('internal - test 0 > get health check - check handler', async () => {
  const testResult = await testDependencies.healthCheckGetRoute.test({
    headers: { check_handler: 'true' },
  })
  expect(testResult.data).toStrictEqual({
    responseBody: {
      data: {},
      statusCode: StatusCodes.OK,
      statusText: ReasonPhrases.OK,
      succeed: true,
    },
    responseHeaders: {
      ...axiosCommonHeadersExpectation,
      health_check_time_start: expect.any(String),
      health_check_time_end: expect.any(String),
    },
    statusCode: StatusCodes.OK,
  })
})

it('internal - test 0 > get health check - check database', async () => {
  const testResult = await testDependencies.healthCheckGetRoute.test({
    headers: { check_handler: 'true', check_database: 'true' },
  })
  expect(testResult.data).toStrictEqual({
    responseBody: {
      data: {
        databaseConnectionStatus: {
          [DatabaseName.DYNAMO]: true,
          [DatabaseName.MONGO]: true,
          [DatabaseName.MYSQL]: true,
          [DatabaseName.POSTGRES]: true,
          [DatabaseName.REDIS]: true,
        },
      },
      statusCode: StatusCodes.OK,
      statusText: ReasonPhrases.OK,
      succeed: true,
    },
    responseHeaders: {
      ...axiosCommonHeadersExpectation,
      health_check_time_start: expect.any(String),
      health_check_time_end: expect.any(String),
    },
    statusCode: StatusCodes.OK,
  })
})

it('internal - test 0 > get health check - check network', async () => {
  const googleEndpoint = testDependencies.googleEndpoint.mock({
    replyWithError: false,
    handler: () => ({
      statusCode: StatusCodes.OK,
      body: 'DONE',
      headers: undefined,
    }),
  })
  const testResult = await testDependencies.healthCheckGetRoute.test({
    headers: { check_handler: 'true', check_network: 'true' },
  })
  expect(testResult.data).toStrictEqual({
    responseBody: {
      data: {
        networkStatus: true,
      },
      statusCode: StatusCodes.OK,
      statusText: ReasonPhrases.OK,
      succeed: true,
    },
    responseHeaders: {
      ...axiosCommonHeadersExpectation,
      health_check_time_start: expect.any(String),
      health_check_time_end: expect.any(String),
    },
    statusCode: StatusCodes.OK,
  })
  expect(googleEndpoint.get().requestList).toStrictEqual([
    {
      request: {
        body: {},
        params: {},
        search: {},
        headers: {
          accept: 'application/json, text/plain, */*',
          'accept-encoding': 'gzip, compress, deflate, br',
          connection: 'close',
          host: 'google.com',
          'user-agent': 'axios/1.9.0',
        },
      },
      response: {
        body: 'DONE',
        headers: undefined,
        statusCode: StatusCodes.OK,
      },
    },
  ])
})
