import type { Request, Handler, ErrorRequestHandler } from 'express'
import type { ReasonPhrases } from 'http-status-codes'
import { StatusCodes } from 'http-status-codes'
import type { HTTPMethod } from 'http-method-enum/dist-types'
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express-serve-static-core'
import type supertest from 'supertest'
import { compile } from 'path-to-regexp'
import type { zod } from '../lib/zod.lib'
import { logger } from '../lib/logger.lib'
import type { Dependencies } from '../../app'
import { Result } from '../lib/result.lib'
import type { ErrorName, MergeResult, ResultMessage } from '../lib/result.lib'
import type { SendResponse } from '../lib/express.lib'
import { openApiGeneratorStoreData } from '../lib/open-api-docs-generator.lib'
import { DateTime } from 'luxon'
import type { RouteName } from '../enum/route-name.enum'

export type RequestHandler<
  TParams extends { [key: string]: any },
  TReqBody extends any,
  TReqQuery extends { [key: string]: any },
  TReqHeaders extends { [key: string]: any },
  TResBody extends any,
  TResHeaders extends { [key: Lowercase<string>]: string | number },
  TLocals extends { [key: string]: any },
  TReqCookies extends { [key: string]: any },
  TValidator extends RouteValidator<
    TParams,
    TReqBody,
    TReqQuery,
    TReqHeaders,
    TReqCookies
  >,
> = (
  req: Omit<
    ExpressRequest<
      TValidator['params'] extends zod.ZodType
        ? zod.output<TValidator['params']>
        : never,
      TResBody,
      TValidator['body'] extends zod.ZodType
        ? zod.output<TValidator['body']>
        : never,
      TValidator['query'] extends zod.ZodType
        ? zod.output<TValidator['query']>
        : never,
      TLocals
    >,
    'headers' | 'cookies'
  > & {
    headers: TValidator['headers'] extends zod.ZodType
      ? zod.output<TValidator['headers']>
      : never
    cookies: TValidator['cookies'] extends zod.ZodType
      ? zod.output<TValidator['cookies']>
      : never
  },
  res: ExpressResponse<TResBody, TLocals>,
  sendResponse: SendResponse<TResBody, TResHeaders>,
) => Promise<void>

export type RouteValidator<
  TParams extends { [key: string]: any },
  TReqBody extends any,
  TReqQuery extends { [key: string]: any },
  TReqHeaders extends { [key: string]: any },
  TReqCookies extends { [key: string]: any },
> = {
  params?: zod.ZodType<TParams>
  query?: zod.ZodType<TReqQuery>
  body?: zod.ZodType<TReqBody>
  headers?: zod.ZodType<TReqHeaders>
  cookies?: zod.ZodType<TReqCookies>
}

type TestRouteConfig<
  TParams extends { [key: string]: any },
  TReqBody extends any,
  TReqQuery extends { [key: string]: any },
  TReqHeaders extends { [key: string]: any },
  TReqCookies extends { [key: string]: any },
  TValidator extends RouteValidator<
    TParams,
    TReqBody,
    TReqQuery,
    TReqHeaders,
    TReqCookies
  >,
> = {
  [K in keyof TValidator as TValidator[K] extends zod.ZodType
    ? K
    : never]: zod.input<
    TValidator[K] extends zod.ZodType ? TValidator[K] : never
  >
}

export type TestRoute<
  TParams extends { [key: string]: any },
  TReqBody extends any,
  TReqQuery extends { [key: string]: any },
  TReqHeaders extends { [key: string]: any },
  TResBody extends Result<any, any, any, any, any>,
  TResHeaders extends { [key: Lowercase<string>]: string | number },
  TReqCookies extends { [key: string]: any },
  TValidator extends RouteValidator<
    TParams,
    TReqBody,
    TReqQuery,
    TReqHeaders,
    TReqCookies
  >,
> = (
  payload: TestRouteConfig<
    TParams,
    TReqBody,
    TReqQuery,
    TReqHeaders,
    TReqCookies,
    TValidator
  >,
) => Promise<{
  payload: TestRouteConfig<
    TParams,
    TReqBody,
    TReqQuery,
    TReqHeaders,
    TReqCookies,
    TValidator
  >
  data: {
    responseHeaders: TResHeaders
    responseBody: RouteApiResponse<TResBody>
    statusCode: StatusCodes
  }
}>

export type Route<
  TParams extends { [key: string]: any },
  TReqBody extends any,
  TReqQuery extends { [key: string]: any },
  TReqHeaders extends { [key: string]: any },
  TResBody extends Result<any, any, any, any, any>,
  TResHeaders extends { [key: Lowercase<string>]: string | number },
  TLocals extends { [key: string]: any },
  TReqCookies extends { [key: string]: any },
  TValidator extends RouteValidator<
    TParams,
    TReqBody,
    TReqQuery,
    TReqHeaders,
    TReqCookies
  >,
  TTestRoute extends TestRoute<
    TParams,
    TReqBody,
    TReqQuery,
    TReqHeaders,
    TResBody,
    TResHeaders,
    TReqCookies,
    TValidator
  >,
  TMethod extends Lowercase<HTTPMethod>,
> = {
  name: RouteName
  path: `/${string}`
  method: TMethod
  middlewares: {
    before: Handler[]
    after: (Handler | ErrorRequestHandler)[]
  }
  validator: TValidator
  test: TTestRoute
  handler: RequestHandler<
    TParams,
    TReqBody,
    TReqQuery,
    TReqHeaders,
    TResBody,
    TResHeaders,
    TLocals,
    TReqCookies,
    TValidator
  >
}

type ErroredItem = {
  type: keyof RouteValidator<any, any, any, any, any>
  issues: zod.ZodIssue[]
}

type PassedItem = {
  type: keyof RouteValidator<any, any, any, any, any>
  data: any
}

type ErrorListItem = ErroredItem | PassedItem

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never

type MergeUnion<T> =
  UnionToIntersection<T> extends infer I
    ? {
        [K in keyof I]: T extends any
          ? K extends keyof T
            ? T[K]
            : never
          : never
      }
    : never

type RouteApiResponse<TResBody extends Result<any, any, any, any, any>> = {
  succeed: MergeResult<TResBody>['succeed']
  statusText: ReasonPhrases
  statusCode: StatusCodes
  data: MergeUnion<TResBody['data']>
  error: {
    name: ErrorName
    message: string
    list: {
      causeList: ErrorName[]
      data: any
      errorName: ErrorName
      id: string
      message: string
      name: ErrorName
      path: string
      parent: null
      stack: string
      succeed: boolean
    }[]
  }
}

const validateRequest = (
  req: Request,
  schemaObject: RouteValidator<any, any, any, any, any>,
): ErrorListItem[] =>
  Object.entries(schemaObject).reduce(
    (acc, [type, schema]: [any, zod.ZodType<any>]) => {
      if (type === 'responseBody') {
        return acc
      }
      const validationResult = schema.safeParse((req as any)[type])
      logger.debug(
        'validation result',
        {
          validationResult,
          headers: req.headers,
        },
        { pretty: true },
      )
      if (validationResult.success === false) {
        return [...acc, { type, issues: validationResult.error.issues }]
      }
      return [...acc, { type, data: validationResult.data }]
    },
    [] as ErrorListItem[],
  )

export const testRoute =
  <
    TParams extends { [key: string]: any },
    TReqBody extends any,
    TReqQuery extends { [key: string]: any },
    TReqHeaders extends { [key: string]: any },
    TResBody extends Result<any, any, any, any, any>,
    TResHeaders extends { [key: Lowercase<string>]: string | number },
    TLocals extends { [key: string]: any },
    TReqCookies extends { [key: string]: any },
    TValidator extends RouteValidator<
      TParams,
      TReqBody,
      TReqQuery,
      TReqHeaders,
      TReqCookies
    >,
    TTestRoute extends TestRoute<
      TParams,
      TReqBody,
      TReqQuery,
      TReqHeaders,
      TResBody,
      TResHeaders,
      TReqCookies,
      TValidator
    >,
  >(
    dependencies: Dependencies,
    route: Route<
      TParams,
      TReqBody,
      TReqQuery,
      TReqHeaders,
      TResBody,
      TResHeaders,
      TLocals,
      TReqCookies,
      TValidator,
      TTestRoute,
      Exclude<Lowercase<HTTPMethod>, 'trace' | 'connect'>
    >,
  ): TestRoute<
    TParams,
    TReqBody,
    TReqQuery,
    { [key: string]: string | string[] },
    TResBody,
    TResHeaders,
    TReqCookies,
    TValidator
  > =>
  async (payload) => {
    logger.notice(`route test request sending...`, [route.method, route.path])
    const expressTest = dependencies.express.test()
    const toPath = compile(route.path)
    const url =
      'params' in payload && payload.params !== undefined
        ? toPath(payload.params as any)
        : route.path
    let routeTest: supertest.Request = (
      expressTest[route.method as keyof typeof expressTest] as any
    )(url)
    if ('query' in payload && payload.query !== undefined) {
      routeTest = routeTest.query(payload.query as any)
    }
    if ('headers' in payload && payload.headers !== undefined) {
      Object.entries(payload.headers as any).forEach(([key, value]) => {
        routeTest = routeTest.set(key, value as any)
      })
    }
    if ('cookies' in payload && payload.cookies !== undefined) {
      // TODO set payload.cookies
    }
    const result =
      'body' in payload && payload.body !== undefined
        ? await routeTest.send(payload.body as any)
        : await routeTest.send()
    openApiGeneratorStoreData({
      configuration: {
        endpoint: route.name,
        method: route.method,
        origin: dependencies.config.APP_NAME,
        path: route.path,
        query: ('query' in payload && (payload?.query as any)) || {},
      },
      request: {
        method: route.method,
        headers: ('headers' in payload && (payload?.headers as any)) || {},
        originalBody:
          'body' in payload && payload.body !== undefined
            ? JSON.stringify(payload.body)
            : '',
        parsedBody: ('body' in payload && payload?.body) || {},
        urlParts: {
          host: dependencies.config.APP_HOST,
          port: Number(dependencies.config.APP_PORT),
          protocol: 'http',
        },
      },
      response: {
        statusCode: result.statusCode,
        body: result.body,
        headers: result.headers,
      },
      timestamp: DateTime.now().toISO(),
    })
    logger.notice(`route test request finished`, [route.method, route.path])
    return {
      payload,
      data: {
        statusCode: result.status,
        responseBody: result.body,
        responseHeaders: result.headers,
      },
    } as any
  }

export const createRoute =
  <
    TResHeaders extends { [key: Lowercase<string>]: string | number },
    TResBody extends { [key: string]: any },
  >(
    responseBodyValidator: zod.ZodType<TResBody>,
    responseHeaderValidator: zod.ZodType<TResHeaders>,
  ) =>
  <
    TParams extends { [key: string]: any },
    TReqBody extends any,
    TReqQuery extends { [key: string]: any },
    TReqHeaders extends { [key: string]: any },
    TLocals extends { [key: string]: any },
    TReqCookies extends { [key: string]: any },
    TValidator extends RouteValidator<
      TParams,
      TReqBody,
      TReqQuery,
      TReqHeaders,
      TReqCookies
    >,
    TTestResult extends Result<boolean, ResultMessage, TResBody, any, any>,
    TTestRoute extends TestRoute<
      TParams,
      TReqBody,
      TReqQuery,
      TReqHeaders,
      TTestResult,
      TResHeaders,
      TReqCookies,
      TValidator
    >,
  >(
    validatorFactory: (dependencies: Dependencies) => TValidator,
    routeFactory: (
      dependencies: Dependencies,
    ) => Omit<
      Route<
        TParams,
        TReqBody,
        TReqQuery,
        TReqHeaders,
        TTestResult,
        TResHeaders,
        TLocals,
        TReqCookies,
        TValidator,
        TTestRoute,
        Lowercase<HTTPMethod>
      >,
      'validator' | 'test'
    >,
  ): ((
    dependencies: Dependencies,
  ) => Route<
    TParams,
    TReqBody,
    TReqQuery,
    TReqHeaders,
    TTestResult,
    TResHeaders,
    TLocals,
    TReqCookies,
    TValidator,
    TTestRoute,
    Lowercase<HTTPMethod>
  >) =>
  (dependencies) => {
    const route = routeFactory(dependencies) as any
    const originalRouteHandler = route.handler
    const validator = validatorFactory(dependencies)
    route.handler = <
      Route<any, any, any, any, any, any, any, any, any, any, any>['handler']
    >(async (req, res, _next) => {
      const validationResults = validateRequest(req, validator)
      const validationErrors: ErroredItem[] = []
      validationResults.forEach((element) => {
        if ('issues' in element) {
          validationErrors.push(element)
        } else {
          req[element.type] = element.data
        }
      })
      const currentSendResponse = dependencies.express.sendResponse(
        res,
        responseBodyValidator,
        responseHeaderValidator,
      )
      if (validationErrors.length > 0) {
        logger.warning('Bad Request Received', {
          body: req.body,
          query: req.query,
          params: req.params,
          validationResults,
        })
        currentSendResponse(
          StatusCodes.BAD_REQUEST,
          new Result(
            false,
            'route request validation failed',
            { validationResults },
            'ROUTE_REQUEST_VALIDATION_ERROR',
          ),
          {},
        )
        return
      }
      await originalRouteHandler(req, res, currentSendResponse)
    })
    route.test = testRoute(dependencies, route)
    return route
  }
