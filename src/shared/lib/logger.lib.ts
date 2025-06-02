import * as winston from 'winston'
import { LEVEL, MESSAGE, SPLAT } from 'triple-beam'
import chalk from 'chalk'
import { secureJsonStringify } from '../parser/secure-json.parser'
import { AppStage } from '../enum/app-stage.enum'
import { inspect } from 'node:util'
import { envVariables } from './dotenv.lib'
import { DateTime } from 'luxon'
import { asyncLocalStorage } from './async-local-storage.lib'
import { appendFileSync } from 'node:fs'

export enum LoggingFileNames {
  AXIOS = 'AXIOS',
  MIDDLEWARE_AUTHORIZATION = 'MIDDLEWARE_AUTHORIZATION',
  MIDDLEWARE_ERROR_HANDLER = 'MIDDLEWARE_ERROR_HANDLER',
  MIDDLEWARE_NOT_FOUND = 'MIDDLEWARE_NOT_FOUND',
  RESULT = 'RESULT',
  PROXY_LOGGER = 'PROXY_LOGGER',
  ROUTE_RESPONSE_VALIDATION_ERROR = 'ROUTE_RESPONSE_VALIDATION_ERROR',
}

const enumToFilePath: { [key in LoggingFileNames]: `log.${string}` } = {
  [LoggingFileNames.MIDDLEWARE_AUTHORIZATION]: 'log.middleware-authorization',
  [LoggingFileNames.MIDDLEWARE_ERROR_HANDLER]: 'log.middleware-error-handler',
  [LoggingFileNames.MIDDLEWARE_NOT_FOUND]: 'log.middleware-not-found',
  [LoggingFileNames.AXIOS]: 'log.axios',
  [LoggingFileNames.RESULT]: 'log.result',
  [LoggingFileNames.PROXY_LOGGER]: 'log.proxy-logger',
  [LoggingFileNames.ROUTE_RESPONSE_VALIDATION_ERROR]:
    'log.route-response-validation-error',
}

type LogConfig = {
  pretty?: boolean
  file?: LoggingFileNames
}

type LogFunction = (
  message: string,

  metadata?: { [key: string]: any },
  logConfig?: LogConfig,
) => void

type LogInfo = { metadata?: any; config?: LogConfig; message: string }
export type Logger = {
  error: LogFunction
  warning: LogFunction
  info: LogFunction
  notice: LogFunction
  debug: LogFunction
  crit: LogFunction
}

const logSeverityToColorMap: { [key in keyof Logger]?: chalk.ChalkFunction } = {
  error: chalk.red,
  warning: chalk.yellow,
  debug: chalk.green,
  crit: chalk.bgRed,
  notice: chalk.bgBlue,
  info: chalk.white,
}

const writeLine = (text: string) =>
  // eslint-disable-next-line no-restricted-globals
  process.stdout.write(`${text}\n`.replaceAll('/app/', '/'))

const prettyFormat = winston.format.printf((info) => {
  const typedInfo = info as LogInfo
  const store = asyncLocalStorage.getStore()
  let message = ''
  message += `${DateTime.now().toISO()}|`
  message = `${envVariables.APP_NAME}|`
  message += `${envVariables.APP_STAGE}|`
  message += `${info[LEVEL]}`
  if (store !== undefined) {
    message += `#${store.executionId}`
  }
  message += ` >${Array.from({
    length: Math.max(100 - message.length, 0),
  })
    .fill('-')
    .join('')}> `
  message += `${typedInfo.message} > `
  if (typedInfo.metadata === undefined) {
    if (typedInfo.metadata?.meta?.stack !== undefined) {
      message += `\n${typedInfo.metadata.meta.stack}`
    }
    return message
  }
  if (typedInfo?.config?.pretty === true) {
    const spacing = '     '
    message +=
      spacing + inspect(typedInfo?.metadata).replaceAll('\n', `\n${spacing}`)
  } else {
    message += secureJsonStringify(typedInfo?.metadata)
  }
  if (typedInfo.metadata?.meta?.stack !== undefined) {
    message += `\n${typedInfo.metadata.meta.stack}`
  }
  if (typedInfo.config?.file !== undefined) {
    appendFileSync(enumToFilePath[typedInfo.config.file], `${message}\n`)
  }
  return message
})

const jsonFormat = winston.format.printf((info) =>
  secureJsonStringify({
    severity: info.level,
    message: info.message,
    metadata: info[SPLAT],
    application: envVariables.APP_NAME,
    environment: envVariables.APP_STAGE,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error

    stack: info.meta && info.meta.stack ? info.meta.stack : undefined,
  }),
)

const isDev = [AppStage.testing, AppStage.development].includes(
  envVariables.APP_STAGE as AppStage,
)
  ? true
  : false

const createWinstonLogger = () =>
  winston.createLogger({
    levels: winston.config.syslog.levels,
    level: envVariables.APP_LOG_LEVEL,
    format: winston.format.combine(
      winston.format.splat(),
      isDev ? prettyFormat : jsonFormat,
    ),
    transports: [
      new winston.transports.Console({
        log(info: any, cb) {
          const colorizer =
            logSeverityToColorMap[
              info[LEVEL] as keyof typeof logSeverityToColorMap
            ]
          writeLine(
            colorizer !== undefined && isDev
              ? colorizer(info[MESSAGE])
              : info[MESSAGE],
          )
          cb()
        },
      }),
    ],
  })
let winstonLogger: winston.Logger | null = null

export const logger = Object.fromEntries(
  Object.keys(logSeverityToColorMap).map((level) => [
    level,
    (...[message, metadata, config]: Parameters<LogFunction>) => {
      if (winstonLogger === null) {
        winstonLogger = createWinstonLogger()
      }
      winstonLogger[level as keyof typeof winstonLogger](message, {
        metadata,
        config,
      })
    },
  ]),
) as Logger
