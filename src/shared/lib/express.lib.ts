import type { Response } from 'express'
import express from 'express'
import supertest from 'supertest'
import type { Server } from 'http'
import { createServer } from 'http'
import type { Route } from '../structure/route.structure'
import 'express-async-errors'
import { logger, LoggingFileNames } from './logger.lib'
import type { Dependencies } from '../../app'
import type { StatusCodes } from 'http-status-codes'
import type { Result } from './result.lib'
import { AppStage } from '../enum/app-stage.enum'
import { getReasonPhrase } from 'http-status-codes'
import type { zod } from './zod.lib'
import type { HTTPMethod } from 'http-method-enum'

export type SendResponse<
  TResponse,
  TResHeaders extends { [key: string]: string | number },
> = (statusCode: StatusCodes, result: TResponse, headers: TResHeaders) => void

export type ExpressApp = {
  attachRoute: (
    route: Route<
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      Lowercase<HTTPMethod>
    >,
  ) => void
  test: () => ReturnType<typeof supertest>
  createServer: () => Server
  initializeRoutes: (routeDependencyNameList: string[]) => void
  sendResponse: <
    TResponse extends Result<any, any, any, any, any>,
    TResHeaders extends Result<any, any, any, any, any>,
  >(
    response: Response,
    bodyValidator?: zod.ZodType<TResponse['data']>,
    headersValidator?: zod.ZodType<TResHeaders['data']>,
  ) => SendResponse<TResponse, TResHeaders['data']>
}

export const expressApp = (dependencies: Dependencies): ExpressApp => {
  const state = {
    app: express(),
  }
  return {
    attachRoute: (route) => {
      logger.debug('express attaching route', [route.method, route.path])
      state.app[route.method](
        route.path,
        ...route.middlewares.before,

        route.handler as any,
        ...route.middlewares.after,
      )
    },
    test: () => supertest(state.app),
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    createServer: () => createServer(state.app),
    initializeRoutes: (routeDependencyNameList) => {
      routeDependencyNameList.forEach((dependencyName) =>
        dependencies.express.attachRoute(
          dependencies[
            dependencyName as keyof Dependencies
          ] as unknown as Route<
            any,
            any,
            any,
            any,
            any,
            any,
            any,
            any,
            any,
            any,
            any
          >,
        ),
      )
      logger.debug('express attaching middleware - not found')
      state.app.use(dependencies.notFoundMiddleware)
    },
    sendResponse:
      (response, bodyValidator, headersValidator) =>
      (statusCode, result, headers) => {
        if (result.succeed === true) {
          const bodyValidationResult = bodyValidator?.safeParse(result.data)
          const headersValidationResult = headersValidator?.safeParse(headers)
          if (
            bodyValidationResult?.success !== true ||
            headersValidationResult?.success !== true
          ) {
            logger.error(
              "application encountered unexpected express response, response will be sent anyway but it's not expected behaviour and should be investigated",
              { bodyValidationResult, headersValidationResult },
              { file: LoggingFileNames.ROUTE_RESPONSE_VALIDATION_ERROR },
            )
          }
        }
        response.set(headers)
        response.status(statusCode).json({
          succeed: result.succeed,
          statusText: getReasonPhrase(statusCode),
          statusCode,
          data: result.data,
          error:
            result.succeed === true
              ? undefined
              : buildResultErrorResponse({
                  error: result,
                  appStage: dependencies.config.APP_STAGE,
                }),
        })
      },
  }
}

const buildResultErrorResponse = (payload: {
  appStage: AppStage
  error: Result<any, any, any, any, any>
}) => {
  switch (payload.appStage) {
    case AppStage.production:
      return {
        name: payload.error.name,
        message: payload.error.message,
      }
    case AppStage.staging:
      return {
        name: payload.error.name,
        message: payload.error.message,
        list: payload.error.getCauseNameList(),
      }
    case AppStage.testing:
    case AppStage.development:
      return {
        name: payload.error.name,
        message: payload.error.message,
        list: payload.error.normalizeCauseList(),
      }
  }
}
