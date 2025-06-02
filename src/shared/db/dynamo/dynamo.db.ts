import {
  DynamoDBClient,
  ListTablesCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  CreateTableCommand,
} from '@aws-sdk/client-dynamodb'
import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { baseDynamoTable } from './table/base.table'
import { AppEnv } from '../../enum/app-env.enum'
import { logger } from '../../lib/logger.lib'
import { Result } from '../../lib/result.lib'
import type { FunctionResult } from '../../lib/result.lib'
import { DatabaseName } from '../../enum/database-name.enum'
import { createDatabase } from '../db.manager'
import type { Dependencies } from '../../../app'

const allDynamoTables = [baseDynamoTable]

type MigratedTableResult = FunctionResult<{}, 'DB_MIGRATION_ERROR'>

export const dynamoDb = (dependencies: Dependencies) =>
  createDatabase<
    DatabaseName.DYNAMO,
    DynamoDBDocumentClient,
    DynamoDBClientConfig & { endpoint: string },
    { client: DynamoDBDocumentClient; rawClient: DynamoDBClient }
  >(
    {
      region: dependencies.config.AWS_REGION,
      endpoint: `http://${dependencies.config.APP_ENV === AppEnv.docker ? `${dependencies.config.DB_DYNAMO_HOST}:${dependencies.config.DB_DYNAMO_PORT_RUNNING}` : `127.0.0.1:${dependencies.config.DB_DYNAMO_PORT_EXPOSED}`}`,
      credentials: {
        accessKeyId: dependencies.config.AWS_ACCESS_KEY_ID,
        secretAccessKey: dependencies.config.AWS_SECRET_ACCESS_KEY,
      },
    },
    (state) => ({
      name: DatabaseName.DYNAMO,
      getHost: () => new URL(state.config.endpoint).hostname,
      getInstance: () => {
        if (state.connected === false || !state.data.client) {
          return new Result(
            false,
            'db dynamo not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }
        return new Result(true, 'db dynamo instance got', state.data.client)
      },
      connect: async () => {
        if (state.connected) {
          return new Result(
            false,
            'db dynamo already connected',
            {},
            'DB_ALREADY_CONNECTED_ERROR',
          )
        }

        logger.debug('database dynamo connecting...', state.config, {
          pretty: true,
        })
        const rawClient = new DynamoDBClient(state.config)
        try {
          await rawClient.send(new ListTablesCommand({}))
          const client = DynamoDBDocumentClient.from(rawClient, {
            marshallOptions: {
              removeUndefinedValues: true,
            },
            unmarshallOptions: {
              wrapNumbers: false,
            },
          })

          state.connect({ client, rawClient })
          logger.debug('database dynamo connected')
          return new Result(true, 'db dynamo connected', {})
        } catch (error) {
          return new Result(
            false,
            'db dynamo connection failed',
            {},
            'DB_CONNECTION_ERROR',
            error,
          )
        }
      },
      disconnect: () => {
        if (state.connected === false) {
          return new Result(
            false,
            'db dynamo not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }
        try {
          logger.debug('database dynamo disconnected')
          state.data.client.destroy()
          state.disconnect()
          return new Result(true, 'db dynamo disconnected', {})
        } catch (error) {
          return new Result(
            false,
            'db dynamo disconnection failed',
            {},
            'DB_DISCONNECTION_ERROR',
            error,
          )
        }
      },
      migrateToLatest: async () => {
        if (state.connected === false) {
          return new Result(
            false,
            'db dynamo not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }
        logger.info('database dynamodb migration started...')

        const migratedTableResultList = await Promise.all(
          allDynamoTables.map(async (table): Promise<MigratedTableResult> => {
            try {
              await state.data.client.send(
                new DescribeTableCommand({ TableName: table.TableName }),
              )
              logger.info(`table "${table.TableName}" already exists`)
            } catch (err: any) {
              if (err.name === 'ResourceNotFoundException') {
                try {
                  await state.data.client.send(new CreateTableCommand(table))
                  logger.info(`table "${table.TableName}" created successfully`)
                } catch (createErr) {
                  // eslint-disable-next-line no-restricted-globals
                  if (createErr instanceof Error) {
                    createErr.cause = err
                  }
                  return new Result(
                    false,
                    'db dynamo table creating failed',
                    { tableName: table.TableName },
                    'DB_MIGRATION_ERROR',
                    createErr,
                  )
                }
              } else {
                return new Result(
                  false,
                  'db dynamo table describing failed',
                  { tableName: table.TableName },
                  'DB_MIGRATION_ERROR',
                  err,
                )
              }
            }
            return new Result(
              true,
              'db dynamo migration table description obtained',
              {},
            )
          }),
        )
        const failedMigrationList = migratedTableResultList.filter(
          (result) => result.succeed === false,
        )
        if (failedMigrationList.length > 0) {
          return new Result(
            false,
            'db dynamo migration failed',
            { failedMigrationList },
            'DB_MIGRATION_ERROR',
          )
        }
        return new Result(true, 'db dynamo migration finished', {
          migratedTableResultList,
        })
      },
      emptyDb: async () => {
        if (dependencies.config.EMPTYING_DATABASE_ALLOWED === false) {
          return new Result(
            false,
            'db mysql emptying disallowed',
            {},
            'DB_EMPTYING_DISALLOWED_ERROR',
          )
        }

        if (state.connected === false) {
          return new Result(
            false,
            'db mysql not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }

        const tables = await state.data.client.send(new ListTablesCommand({}))
        if (tables.TableNames === undefined) {
          return new Result(true, 'db dynamo emptying completed', { amount: 0 })
        }
        const emptiedTAbleResultList = await Promise.all(
          tables.TableNames.map(
            async (
              tableName,
            ): FunctionResult<Promise<{}>, 'DB_EMPTYING_ERROR'> => {
              await state.data.rawClient.send(
                new DeleteTableCommand({ TableName: tableName }),
              )
              logger.info(`database dynamo table deleted: ${tableName}`)
              const tableConfig = allDynamoTables.find(
                (table) => table.TableName === tableName,
              )
              if (tableConfig === undefined) {
                return new Result(
                  false,
                  'db dynamo table config missing',
                  {},
                  'DB_EMPTYING_ERROR',
                )
              }
              await state.data.rawClient.send(
                new CreateTableCommand(tableConfig),
              )
              logger.info(`database dynamo table created: ${tableName}`)
              return new Result(true, 'db dynamo emptying completed', {})
            },
          ),
        )
        const failedResultList = emptiedTAbleResultList.filter(
          (result) => result.succeed === false,
        )
        if (failedResultList.length > 0) {
          return new Result(
            false,
            'db dynamo emptying failed',
            { failedResultList },
            'DB_EMPTYING_ERROR',
          )
        }
        logger.info(
          `database dynamo emptied: [${tables.TableNames.join(', ')}]`,
        )
        return new Result(true, 'db dynamo emptying completed', {
          amount: emptiedTAbleResultList.length,
        })
      },
    }),
  )
