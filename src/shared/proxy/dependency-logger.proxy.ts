import type {
  OnErrorPayload,
  OnNonFunctionPayload,
  OnSuccessPayload,
} from 'generic-interceptor'
import { ProcessingResult, interceptor } from 'generic-interceptor'
import { secureJsonStringify } from '../parser/secure-json.parser'
import type { DependencyProxyHandlerOptions } from '../lib/awilix.lib'
import { logger, LoggingFileNames } from '../lib/logger.lib'

export const buildFunctionMessage = (
  payload: OnErrorPayload<false> | OnSuccessPayload<false>,
): string =>
  `(${secureJsonStringify(payload.functionArgs)}) => ${
    payload.processingStrategy
  }#${payload.processingResult}:${secureJsonStringify(
    payload.processingResult === ProcessingResult.failed
      ? payload.functionError
      : payload.functionResult,
  )}`

export const buildMessage = (
  payload:
    | OnErrorPayload<false>
    | OnSuccessPayload<false>
    | OnNonFunctionPayload,
  options: DependencyProxyHandlerOptions,
): string =>
  `${options.dependencyName}.<${payload.fieldValueType}>${String(
    payload.fieldKey,
  )}${'processingResult' in payload ? buildFunctionMessage(payload) : ''}`

export const loggerProxy =
  (
    config?: Partial<DependencyProxyHandlerOptions> & {
      doNotLogFunctionNames?: string[]
    },
  ) =>
  (options: DependencyProxyHandlerOptions): ProxyHandler<any> =>
    interceptor({
      passId: false,
      onBefore: (payload) => {
        if (
          config?.doNotLogFunctionNames?.includes(payload.fieldKey) === true
        ) {
          return
        }
        logger.info(
          buildMessage(payload, { ...options, ...config }),
          {},
          { file: LoggingFileNames.PROXY_LOGGER },
        )
      },
      onError: (payload) => {
        logger.warning(
          buildMessage(payload, { ...options, ...config }),
          {},
          { file: LoggingFileNames.PROXY_LOGGER },
        )
      },
      onSuccess: (payload) => {
        if (
          config?.doNotLogFunctionNames?.includes(payload.fieldKey) === true
        ) {
          return
        }
        logger.info(
          buildMessage(payload, { ...options, ...config }),
          {},
          { file: LoggingFileNames.PROXY_LOGGER },
        )
      },
      onNonFunction: () => {},
    })
