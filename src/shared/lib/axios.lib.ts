import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import axios from 'axios'
import { StatusCodes } from 'http-status-codes'
import { DateTime } from 'luxon'
import { logger, LoggingFileNames } from './logger.lib'

export const requestOnFulfilledInterceptor = (
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
  try {
    const objectToLog = {
      requestStartedAt: DateTime.now().toISO(),
      url: config.url,
      method: config.method?.toUpperCase(),
      headers: config.headers,

      params: config.params,
    }
    logger.info(
      `AXIOS: Request started: ${objectToLog.method} ${objectToLog.url}`,
      objectToLog,
      { file: LoggingFileNames.AXIOS },
    )
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error

    config.requestStartedAt = objectToLog.requestStartedAt
  } catch (interceptorError) {
    logger.crit('AXIOS: Interceptor failed while processing request', {
      interceptorError,
      file: LoggingFileNames.AXIOS,
    })
  }
  return config
}

export const responseOnFulfilledInterceptor = (
  response: AxiosResponse,
): AxiosResponse => {
  try {
    const requestFinishedAt = DateTime.now()
    const objectToLog = {
      requestFinishedAt: requestFinishedAt.toISO(),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      requestStartedAt: response.config.requestStartedAt,
      requestDurationInMilliseconds:
        requestFinishedAt.toMillis() -
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        DateTime.fromISO(response.config.requestStartedAt).toMillis(),
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      headers: response.config.headers,
      params: response.config.params,
      responseStatus: response.status,
    }
    const messageToLog = `AXIOS: Request finished with status '${
      objectToLog.responseStatus || 'NO RESPONSE STATUS'
    }': ${objectToLog.method} ${objectToLog.url}` as const
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (response.status === StatusCodes.OK) {
      logger.debug(messageToLog, objectToLog, { file: LoggingFileNames.AXIOS })
    } else {
      logger.warning(messageToLog, objectToLog, {
        file: LoggingFileNames.AXIOS,
      })
    }
  } catch (interceptorError) {
    logger.crit(
      'AXIOS: Interceptor failed while processing fulfilled response',
      { interceptorError },
      { file: LoggingFileNames.AXIOS },
    )
  }
  return response
}

export const responseOnRejectedInterceptor = (
  error: AxiosError & { config?: { requestStartedAt: string } },
): never => {
  try {
    const requestFinishedAt = DateTime.now()
    const objectToLog = {
      requestFinishedAt: requestFinishedAt.toISO(),
      requestStartedAt: error.config?.requestStartedAt,
      requestDurationInMilliseconds:
        error.config?.requestStartedAt === undefined
          ? undefined
          : requestFinishedAt.toMillis() -
            DateTime.fromISO(error.config?.requestStartedAt).toMillis(),
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      headers: error.config?.headers,
      params: error.config?.params,
    }
    logger.error(
      `AXIOS: Requests errored: ${objectToLog.method} ${objectToLog.url}`,
      objectToLog,
      { file: LoggingFileNames.AXIOS },
    )
  } catch (interceptorError) {
    logger.crit(
      'AXIOS: Interceptor failed while processing rejected response',
      { interceptorError },
      { file: LoggingFileNames.AXIOS },
    )
  }
  //rethrowing anything interceptors gets, do not modify
  throw error
}

export const initializeAxios = (): ReturnType<typeof axios.create> => {
  const axiosInstance = axios.create({ validateStatus: () => true })
  axiosInstance.interceptors.request.use(requestOnFulfilledInterceptor)
  axiosInstance.interceptors.response.use(
    responseOnFulfilledInterceptor,
    responseOnRejectedInterceptor,
  )
  return axiosInstance
}
