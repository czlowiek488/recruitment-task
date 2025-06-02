import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { expect, it } from 'vitest'
import { DatabaseName } from '../../src/shared/enum/database-name.enum'
import { AppStage } from '../../src/shared/enum/app-stage.enum'
import { axiosCommonHeadersExpectation, testDependencies } from '../setup'

it('internal - test 2 > happy path: response', async () => {
  const dataset = await testDependencies.prepareInternalTest2({
    config: {},
    counter: 1,
    databaseType: DatabaseName.DYNAMO,
    replyWithError: false,
  })

  const result = await dataset.execute()

  expect(result.internalTest2Result.data).toStrictEqual({
    statusCode: StatusCodes.OK,
    responseHeaders: axiosCommonHeadersExpectation,
    responseBody: {
      succeed: true,
      statusCode: StatusCodes.OK,
      statusText: ReasonPhrases.OK,
      data: {
        counter: expect.any(Number),
      },
    },
  })
})

it.each(Object.values(DatabaseName))(
  'internal - test 2 > happy path: all databases %s',
  async (databaseType) => {
    const dataset = await testDependencies.prepareInternalTest2({
      config: {},
      counter: 1,
      databaseType,
      replyWithError: false,
    })

    const result = await dataset.execute()

    expect(result.internalTest2Result.data).toStrictEqual({
      statusCode: StatusCodes.OK,
      responseHeaders: axiosCommonHeadersExpectation,
      responseBody: {
        succeed: true,
        statusCode: StatusCodes.OK,
        statusText: ReasonPhrases.OK,
        data: {
          counter: expect.any(Number),
        },
      },
    })
  },
)

it('internal - test 2 > happy path: counter 3', async () => {
  const dataset = await testDependencies.prepareInternalTest2({
    config: {},
    counter: 3,
    databaseType: DatabaseName.DYNAMO,
    replyWithError: false,
  })

  const result = await dataset.execute()

  expect(result.internalTest2Result.data).toStrictEqual({
    statusCode: StatusCodes.OK,
    responseHeaders: axiosCommonHeadersExpectation,
    responseBody: {
      succeed: true,
      statusCode: StatusCodes.OK,
      statusText: ReasonPhrases.OK,
      data: {
        counter: expect.any(Number),
      },
    },
  })
})

it('internal - test 2 > happy path: counter 0', async () => {
  const dataset = await testDependencies.prepareInternalTest2({
    config: {},
    counter: 0,
    databaseType: DatabaseName.DYNAMO,
    replyWithError: false,
  })

  const result = await dataset.execute()

  expect(result.internalTest2Result.data).toStrictEqual({
    statusCode: StatusCodes.OK,
    responseHeaders: axiosCommonHeadersExpectation,
    responseBody: {
      succeed: true,
      statusCode: StatusCodes.OK,
      statusText: ReasonPhrases.OK,
      data: {
        counter: expect.any(Number),
      },
    },
  })
})

it('internal - test 2 > happy path: staging', async () => {
  const dataset = await testDependencies.prepareInternalTest2({
    config: {},
    counter: 0,
    databaseType: DatabaseName.DYNAMO,
    replyWithError: false,
  })

  const result = await dataset.execute()

  expect(result.internalTest2Result.data).toStrictEqual({
    statusCode: StatusCodes.OK,
    responseHeaders: axiosCommonHeadersExpectation,
    responseBody: {
      succeed: true,
      statusCode: StatusCodes.OK,
      statusText: ReasonPhrases.OK,
      data: {
        counter: expect.any(Number),
      },
    },
  })
})

it('internal - test 2 > error: reply - testing', async () => {
  const dataset = await testDependencies.prepareInternalTest2({
    config: {
      APP_STAGE: AppStage.testing,
    },
    counter: 1,
    databaseType: DatabaseName.DYNAMO,
    replyWithError: true,
  })

  const result = await dataset.execute()
  expect(result.internalTest2Result.data).toStrictEqual({
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    responseHeaders: axiosCommonHeadersExpectation,
    responseBody: {
      succeed: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      statusText: ReasonPhrases.INTERNAL_SERVER_ERROR,
      data: {},
      error: {
        list: [
          {
            causeList: [
              'ROUTE_UNHANDLED_ERROR',
              'HANDLER_EXECUTION_CAUGHT_ERROR',
              'ENDPOINT_REQUEST_ERROR',
              'Error',
            ],
            data: {},
            parent: null,
            executionId: expect.any(String),
            id: expect.any(String),
            message: 'route did not handled an error',
            path: expect.any(String),
            name: 'ROUTE_UNHANDLED_ERROR',
            stack: expect.any(String),
            succeed: false,
          },
          {
            causeList: [
              'HANDLER_EXECUTION_CAUGHT_ERROR',
              'ENDPOINT_REQUEST_ERROR',
              'Error',
            ],
            data: {
              executionId: expect.any(String),
              name: 'INTERNAL_TEST_2',
              payload: {
                counterId:
                  result.postBaseResult.data.responseBody.data?.counterId,
                databaseType: dataset.payload.databaseType,
              },
            },
            parent: null,
            executionId: expect.any(String),
            id: expect.any(String),
            path: expect.any(String),
            message: 'handler execution error caught',
            name: 'HANDLER_EXECUTION_CAUGHT_ERROR',
            stack: expect.any(String),
            succeed: false,
          },
          {
            causeList: ['ENDPOINT_REQUEST_ERROR', 'Error'],
            data: {
              data: {
                testRequestDataKey: 'testRequestDataValue',
              },
              headers: {
                testRequestHeaderKey: 'testRequestHeaderValue',
              },
              method: 'GET',
              url: expect.any(String),
            },
            parent: null,
            executionId: expect.any(String),
            id: expect.any(String),
            message: 'endpoint request failed',
            path: expect.any(String),
            name: 'ENDPOINT_REQUEST_ERROR',
            stack: expect.any(String),
            succeed: false,
          },
          {
            code: null,
            config: {
              data: '{"testRequestDataKey":"testRequestDataValue"}',
              headers: {
                Accept: 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, compress, deflate, br',
                'Content-Length': expect.any(String),
                'Content-Type': 'application/json',
                'User-Agent': 'axios/1.9.0',
                testRequestHeaderKey: 'testRequestHeaderValue',
              },
              method: 'get',
              url: expect.any(String),
            },
            isAxiosError: true,
            message: 'mocked error on request object',
            response: null,
            stack: expect.any(String),
          },
        ],
        message: 'route did not handled an error',
        name: 'ROUTE_UNHANDLED_ERROR',
      },
    },
  })
})

it('internal - test 2 > error: reply production', async () => {
  const dataset = await testDependencies.prepareInternalTest2({
    counter: 1,
    databaseType: DatabaseName.DYNAMO,
    replyWithError: true,
    config: {
      APP_STAGE: AppStage.production,
    },
  })

  const result = await dataset.execute()

  expect(result.internalTest2Result.data).toStrictEqual({
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    responseHeaders: axiosCommonHeadersExpectation,
    responseBody: {
      succeed: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      statusText: ReasonPhrases.INTERNAL_SERVER_ERROR,
      data: {},
      error: {
        name: 'ROUTE_UNHANDLED_ERROR',
        message: `route did not handled an error`,
      },
    },
  })
})

it('internal - test 2 > error: reply staging', async () => {
  const dataset = await testDependencies.prepareInternalTest2({
    counter: 1,
    databaseType: DatabaseName.DYNAMO,
    replyWithError: true,
    config: {
      APP_STAGE: AppStage.staging,
    },
  })

  const result = await dataset.execute()

  expect(result.internalTest2Result.data).toStrictEqual({
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    responseHeaders: axiosCommonHeadersExpectation,
    responseBody: {
      succeed: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      statusText: ReasonPhrases.INTERNAL_SERVER_ERROR,
      data: {},
      error: {
        name: 'ROUTE_UNHANDLED_ERROR',
        message: `route did not handled an error`,
        list: [
          'ROUTE_UNHANDLED_ERROR',
          'HANDLER_EXECUTION_CAUGHT_ERROR',
          'ENDPOINT_REQUEST_ERROR',
          'Error',
        ],
      },
    },
  })
})

it('internal - test 2 > error: reply development', async () => {
  const dataset = await testDependencies.prepareInternalTest2({
    counter: 1,
    databaseType: DatabaseName.DYNAMO,
    replyWithError: true,
    config: {
      APP_STAGE: AppStage.development,
    },
  })

  const result = await dataset.execute()

  expect(result.internalTest2Result.data).toStrictEqual({
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    responseHeaders: axiosCommonHeadersExpectation,
    responseBody: {
      succeed: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      statusText: ReasonPhrases.INTERNAL_SERVER_ERROR,
      data: {},
      error: {
        name: 'ROUTE_UNHANDLED_ERROR',
        message: `route did not handled an error`,
        list: [
          {
            causeList: [
              'ROUTE_UNHANDLED_ERROR',
              'HANDLER_EXECUTION_CAUGHT_ERROR',
              'ENDPOINT_REQUEST_ERROR',
              'Error',
            ],
            data: {},
            parent: null,
            path: expect.any(String),
            executionId: expect.any(String),
            id: expect.any(String),
            message: 'route did not handled an error',
            name: 'ROUTE_UNHANDLED_ERROR',
            stack: expect.any(String),
            succeed: false,
          },
          {
            causeList: [
              'HANDLER_EXECUTION_CAUGHT_ERROR',
              'ENDPOINT_REQUEST_ERROR',
              'Error',
            ],
            data: {
              executionId: expect.any(String),
              name: 'INTERNAL_TEST_2',
              payload: {
                counterId:
                  result.postBaseResult.data.responseBody.data?.counterId,
                databaseType: dataset.payload.databaseType,
              },
            },
            parent: null,
            executionId: expect.any(String),
            id: expect.any(String),
            message: 'handler execution error caught',
            path: expect.any(String),
            name: 'HANDLER_EXECUTION_CAUGHT_ERROR',
            stack: expect.any(String),
            succeed: false,
          },
          {
            causeList: ['ENDPOINT_REQUEST_ERROR', 'Error'],
            data: {
              data: {
                testRequestDataKey: 'testRequestDataValue',
              },
              headers: {
                testRequestHeaderKey: 'testRequestHeaderValue',
              },
              method: 'GET',
              url: expect.any(String),
            },
            parent: null,
            executionId: expect.any(String),
            id: expect.any(String),
            message: 'endpoint request failed',
            path: expect.any(String),
            name: 'ENDPOINT_REQUEST_ERROR',
            stack: expect.any(String),
            succeed: false,
          },
          {
            code: null,
            config: {
              data: '{"testRequestDataKey":"testRequestDataValue"}',
              headers: {
                Accept: 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, compress, deflate, br',
                'Content-Length': expect.any(String),
                'Content-Type': 'application/json',
                'User-Agent': 'axios/1.9.0',
                testRequestHeaderKey: 'testRequestHeaderValue',
              },
              method: 'get',
              url: expect.any(String),
            },
            isAxiosError: true,
            message: 'mocked error on request object',
            response: null,
            stack: expect.any(String),
          },
        ],
      },
    },
  })
})
