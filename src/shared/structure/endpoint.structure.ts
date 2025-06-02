import type { HTTPMethod } from 'http-method-enum'
import type { StatusCodes } from 'http-status-codes'
import { compile, match, pathToRegexp } from 'path-to-regexp'
import nock from 'nock'
import { stringify } from 'querystring'
import { logger } from '../lib/logger.lib'
import { autoBodyParse } from '../parser/auto-body.parser'
import type { Dependencies } from '../../app'
import { Result } from '../lib/result.lib'
import { openApiGeneratorStoreData } from '../lib/open-api-docs-generator.lib'
import { DateTime } from 'luxon'

export enum EndpointName {
  GOOGLE = 'GOOGLE',
  TEST_2 = 'TEST_2',
}

export type EndpointResponse<
  TStatusCode extends StatusCodes,
  TResponseBody extends any,
  TResponseHeaders extends any,
> = {
  statusCode: TStatusCode | StatusCodes.NOT_FOUND
  body: TResponseBody
  headers: TResponseHeaders
}

export type EndpointRequest<
  TRequestHeaders extends any,
  TRequestBody extends any,
  TRequestQuery extends any,
  TRequestParams extends any,
> = {
  headers: TRequestHeaders
  body: TRequestBody
  query: TRequestQuery
  params: TRequestParams
}

export type EndpointData<
  TEndpointRequest extends EndpointRequest<any, any, any, any>,
  TEndpointResponse extends EndpointResponse<any, any, any>,
> = {
  response: TEndpointResponse
  request: TEndpointRequest
}

type RequestEndpoint<TEndpointData extends EndpointData<any, any>> = (
  payload: TEndpointData['request'],
) => Promise<TEndpointData['response']> | TEndpointData['response']
export type MockEndpointQuery = { [key: string]: string }

type MockEndpoint<TEndpointData extends EndpointData<any, any>> = (payload: {
  handler: RequestEndpoint<TEndpointData>
  query?: MockEndpointQuery | ((data: any) => boolean)
  replyWithError: boolean
}) => {
  cleanup: () => void
  get: () => {
    requestList: TEndpointData[]
    nockScope: nock.Scope
  }
}

type Endpoint<
  TEndpointName extends EndpointName,
  THTTPMethod extends Exclude<
    HTTPMethod,
    HTTPMethod.CONNECT | HTTPMethod.TRACE
  >,
  TPath extends `/${string}`,
  TOrigin extends string,
  TEndpointData extends EndpointData<any, any>,
> = {
  endpointName: TEndpointName
  method: THTTPMethod
  origin: TOrigin
  path: TPath
  request: RequestEndpoint<TEndpointData>
  mock: MockEndpoint<TEndpointData>
}

export const createEndpoint =
  <
    TEndpointName extends EndpointName,
    THTTPMethod extends Exclude<
      HTTPMethod,
      HTTPMethod.CONNECT | HTTPMethod.TRACE
    >,
    TOrigin extends string,
    TPath extends `/${string}`,
  >(
    loadConfig: (dependencies: Dependencies) => {
      method: THTTPMethod
      path: TPath
      origin: TOrigin
      endpointName: TEndpointName
    },
  ) =>
  <TEndpointData extends EndpointData<any, any>>() =>
  (
    dependencies: Dependencies,
  ): Endpoint<TEndpointName, THTTPMethod, TPath, TOrigin, TEndpointData> => {
    const config = loadConfig(dependencies)
    const toPath = compile(config.path)
    const pathRegexp = pathToRegexp(config.path)
    const toParams = match(config.path)
    const endpoint: Endpoint<
      TEndpointName,
      THTTPMethod,
      TPath,
      TOrigin,
      TEndpointData
    > = {
      endpointName: config.endpointName,
      method: config.method,
      origin: config.origin,
      path: config.path,
      mock: (payload) => {
        let requestList: TEndpointData[] = []
        logger.notice('endpoint mocking...', { config, payload })
        const nockMock = nock(config.origin)
          .persist()
          [
            config.method.toLowerCase() as keyof Pick<
              nock.Scope,
              Lowercase<
                Exclude<HTTPMethod, HTTPMethod.CONNECT | HTTPMethod.TRACE>
              >
            >
          ](pathRegexp.keys.length > 0 ? pathRegexp.regexp : config.path)

        const nockMockWithQuery =
          payload.query === undefined ? nockMock : nockMock.query(payload.query)

        if (payload.replyWithError !== false) {
          const nockScope = nockMockWithQuery.replyWithError(
            payload.replyWithError !== true
              ? payload.replyWithError
              : 'mocked error on request object',
          )

          logger.notice('endpoint mocked, reply throws error', {
            config,
            payload,
          })
          return {
            get: () => ({
              nockScope,
              requestList,
            }),
            cleanup: () => {
              requestList = []
            },
          }
        }
        const nockScope = nockMockWithQuery.reply(
          async function mockReplyFunction(path, body) {
            try {
              logger.notice('endpoint mock handling request...', {
                config,
                payload,
                path,
                body,
              })
              const data = {
                body: { ...autoBodyParse(body) },
                headers: { ...this.req.headers },
              }
              const url = new URL(config.origin + path)
              const params = toParams(url.pathname)
              const request = {
                body: data.body,
                headers: data.headers,
                params: params === false ? {} : { ...params.params },
                search: Object.fromEntries(url.searchParams),
              }
              const response = await payload.handler(request)
              requestList.push({ response, request } as TEndpointData)
              logger.notice('endpoint mock handled successfully', {
                config,
                payload,
                path,
                body,
                response: {
                  statusCode: response.statusCode,
                  body: response.body,
                  headers: response.headers,
                },
              })
              return [response.statusCode, response.body, response.headers]
            } catch (error) {
              logger.notice('endpoint mock handling errored', {
                config,
                payload,
                path,
                body,
              })
              throw new Result(
                false,
                'endpoint mock execution failed',
                {},
                'ENDPOINT_MOCK_EXECUTION_ERROR',
                error,
              ).destroyToThrow()
            }
          },
        )

        logger.notice('endpoint mocked, awaiting requests', { config, payload })
        return {
          get: () => ({
            nockScope,
            requestList,
          }),
          cleanup: () => {
            requestList = []
          },
        }
      },
      request: async (payload) => {
        let url: string = config.origin
        if (payload.params !== undefined) {
          url += toPath(payload.params)
        } else {
          url += config.path
        }
        const queryString = stringify(payload.query)
        if (queryString.length > 0) {
          url += `?${queryString}`
        }
        const axiosConfig = {
          method: config.method,
          url,
          data: payload.body,
          headers: payload.headers,
        }
        try {
          logger.notice('endpoint mock request sending...', { axiosConfig })
          const result = await dependencies.axios(axiosConfig)
          logger.notice('endpoint mock request sent', {
            body: result.data,
            headers: result.headers,
            statusCode: result.status,
            axiosConfig,
          })
          const url = new URL(endpoint.origin)
          openApiGeneratorStoreData({
            configuration: {
              endpoint: endpoint.endpointName,
              method: endpoint.method.toLowerCase() as Lowercase<THTTPMethod>,
              origin: url.origin,
              path: url.pathname.replace('/', ''),
              query: {},
            },
            request: {
              method: endpoint.method.toLowerCase() as Lowercase<THTTPMethod>,
              headers: payload.headers || {},
              originalBody: JSON.stringify(payload.body || {}),
              parsedBody: payload.body || {},
              urlParts: {
                host: `/${url.host}`,
                port: Number(url.port || '80'),
                protocol: '',
              },
            },
            response: {
              statusCode: result.status,
              body: result.data || {},
              headers:
                (result.headers as { [key: string]: string | string[] }) || {},
            },
            timestamp: DateTime.now().toISO(),
          })
          return {
            body: result.data,
            headers: result.headers,
            statusCode: result.status,
          }
        } catch (error) {
          logger.notice('endpoint mock request sending failed', {
            axiosConfig,
            error,
          })
          throw new Result(
            false,
            'endpoint request failed',
            axiosConfig,
            'ENDPOINT_REQUEST_ERROR',
            error,
          )
        }
      },
    }
    return endpoint
  }
