import { AppStage } from './shared/enum/app-stage.enum'
import { AppEnv } from './shared/enum/app-env.enum'
import { AppLogLevel } from './shared/enum/app-log-level.enum'
import { zod } from './shared/lib/zod.lib'
import { Result } from './shared/lib/result.lib'
import type { FunctionResult } from './shared/lib/result.lib'

export const configValidator = zod.object({
  // app
  EMPTYING_DATABASE_ALLOWED: zod.boolean({ coerce: true }).default(false),

  // app control
  APP_NAME: zod.string(),
  APP_ENV: zod.nativeEnum(AppEnv),
  APP_STAGE: zod.nativeEnum(AppStage),
  APP_PORT: zod.number({ coerce: true }).default(3025),
  APP_LOG_LEVEL: zod.nativeEnum(AppLogLevel),
  APP_HOST: zod.string(),
  // app aws
  AWS_REGION: zod.string(),
  AWS_ACCESS_KEY_ID: zod.string(),
  AWS_SECRET_ACCESS_KEY: zod.string(),

  // database

  // database postgresql
  DB_POSTGRES_HOST: zod.string(),
  DB_POSTGRES_PORT_EXPOSED: zod.number({ coerce: true }),
  DB_POSTGRES_USER: zod.string(),
  DB_POSTGRES_PASSWORD: zod.string(),
  DB_POSTGRES_NAME: zod.string(),
  // database mysql
  DB_MYSQL_HOST: zod.string(),
  DB_MYSQL_PORT_EXPOSED: zod.number({ coerce: true }),
  DB_MYSQL_USER: zod.string(),
  DB_MYSQL_PASSWORD: zod.string(),
  DB_MYSQL_DATABASE: zod.string(),
  // database redis
  DB_REDIS_HOST: zod.string(),
  DB_REDIS_PORT_EXPOSED: zod.number({ coerce: true }),
  DB_REDIS_PASSWORD: zod.string(),
  // database mongodb
  DB_MONGO_HOST: zod.string(),
  DB_MONGO_USERNAME: zod.string(),
  DB_MONGO_PASSWORD: zod.string(),
  DB_MONGO_NAME: zod.string(),
  DB_MONGO_PORT_EXPOSED: zod.number({ coerce: true }),
  // database dynamodb
  DB_DYNAMO_PORT_EXPOSED: zod.number({ coerce: true }),
  DB_DYNAMO_PORT_RUNNING: zod.number({ coerce: true }),
  DB_DYNAMO_HOST: zod.string(),

  // integration config
  INTEGRATION_GOOGLE_BASE_PATH: zod.string(),
  INTEGRATION_EXAMPLE_URL: zod.string(),
})

export type Config = zod.output<typeof configValidator>

export const loadConfig = (
  env: NodeJS.ProcessEnv,
): FunctionResult<Config, 'CONFIG_VALIDATION_ERROR'> => {
  const configValidationResult = configValidator.safeParse({
    // app
    EMPTYING_DATABASE_ALLOWED: env.EMPTYING_DATABASE_ALLOWED,

    // app control
    APP_NAME: env.APP_NAME,
    APP_ENV: env.APP_ENV,
    APP_STAGE: env.APP_STAGE,
    APP_PORT: env.APP_PORT,
    APP_LOG_LEVEL: env.APP_LOG_LEVEL,
    APP_HOST: env.APP_HOST,
    // app aws
    AWS_REGION: env.AWS_REGION,
    AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,

    // database

    // database postgresql
    DB_POSTGRES_HOST: env.DB_POSTGRES_HOST,
    DB_POSTGRES_PORT_EXPOSED: env.DB_POSTGRES_PORT_EXPOSED,
    DB_POSTGRES_USER: env.DB_POSTGRES_USER,
    DB_POSTGRES_PASSWORD: env.DB_POSTGRES_PASSWORD,
    DB_POSTGRES_NAME: env.DB_POSTGRES_NAME,
    // database mysql
    DB_MYSQL_HOST: env.DB_MYSQL_HOST,
    DB_MYSQL_PORT_EXPOSED: env.DB_MYSQL_PORT_EXPOSED,
    DB_MYSQL_USER: env.DB_MYSQL_USER,
    DB_MYSQL_PASSWORD: env.DB_MYSQL_PASSWORD,
    DB_MYSQL_DATABASE: env.DB_MYSQL_DATABASE,
    // database redis
    DB_REDIS_HOST: env.DB_REDIS_HOST,
    DB_REDIS_PORT_EXPOSED: env.DB_REDIS_PORT_EXPOSED,
    DB_REDIS_PASSWORD: env.DB_REDIS_PASSWORD,
    // database mongodb
    DB_MONGO_HOST: env.DB_MONGO_HOST,
    DB_MONGO_USERNAME: env.DB_MONGO_USERNAME,
    DB_MONGO_PASSWORD: env.DB_MONGO_PASSWORD,
    DB_MONGO_NAME: env.DB_MONGO_NAME,
    DB_MONGO_PORT_EXPOSED: env.DB_MONGO_PORT_EXPOSED,
    // database dynamodb
    DB_DYNAMO_PORT_EXPOSED: env.DB_DYNAMO_PORT_EXPOSED,
    DB_DYNAMO_HOST: env.DB_DYNAMO_HOST,
    DB_DYNAMO_PORT_RUNNING: env.DB_DYNAMO_PORT_RUNNING,

    // integration
    INTEGRATION_GOOGLE_BASE_PATH: env.INTEGRATION_GOOGLE_BASE_PATH,
    INTEGRATION_EXAMPLE_URL: env.INTEGRATION_EXAMPLE_URL,
  })

  if (configValidationResult.success === false) {
    return new Result(
      false,
      'config validation failed',
      configValidationResult,
      'CONFIG_VALIDATION_ERROR',
    )
  }
  return new Result(true, 'config loaded', configValidationResult.data)
}
