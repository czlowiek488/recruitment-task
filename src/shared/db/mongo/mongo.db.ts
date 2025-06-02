import type { Db, MongoClientOptions } from 'mongodb'
import { MongoClient } from 'mongodb'
import { AppEnv } from '../../enum/app-env.enum'
import { logger } from '../../lib/logger.lib'
import { Result } from '../../lib/result.lib'
import { createDatabase } from '../db.manager'
import { DatabaseName } from '../../enum/database-name.enum'
import type { Dependencies } from '../../../app'

export enum CollectionName {
  BASE_COLLECTION = 'BASE_COLLECTION',
}

export const mongoDb = (dependencies: Dependencies) =>
  createDatabase<
    DatabaseName.MONGO,
    Db,
    { url: string; options: MongoClientOptions },
    { db: Db; client: MongoClient }
  >(
    {
      url: `mongodb://${dependencies.config.APP_ENV === AppEnv.docker ? dependencies.config.DB_MONGO_HOST : `127.0.0.1:${dependencies.config.DB_MONGO_PORT_EXPOSED}`}/${dependencies.config.DB_MONGO_NAME}`,
      options: {
        auth: {
          username: dependencies.config.DB_MONGO_USERNAME,
          password: dependencies.config.DB_MONGO_PASSWORD,
        },
      },
    },
    (state) => ({
      name: DatabaseName.MONGO,
      getHost: () => state.config.url,
      getInstance: () => {
        logger.debug('getting mongo instance...')
        if (state.connected === false) {
          return new Result(
            false,
            'db mongo not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }
        return new Result(true, 'db mongo instance got', state.data.db)
      },
      connect: async () => {
        if (state.connected === true) {
          return new Result(
            false,
            'db mongo already connected',
            {},
            'DB_ALREADY_CONNECTED_ERROR',
          )
        }
        const client = await new MongoClient(
          state.config.url,
          state.config.options,
        ).connect()
        state.connect({ client, db: client.db() })
        return new Result(true, 'db mongo connected', {})
      },
      disconnect: async () => {
        if (state.connected === false) {
          return new Result(
            false,
            'db mongo not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }
        await state.data.client.close()
        state.disconnect()
        return new Result(true, 'db mongo disconnected', {})
      },
      emptyDb: async () => {
        if (dependencies.config.EMPTYING_DATABASE_ALLOWED === false) {
          return new Result(
            false,
            'db mongo emptying disallowed',
            {},
            'DB_EMPTYING_DISALLOWED_ERROR',
          )
        }
        if (state.connected === false) {
          return new Result(
            false,
            'db mongo not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }
        await Promise.all(
          Object.values(CollectionName).map((collectionName: CollectionName) =>
            state.data.db.collection(collectionName).deleteMany({}),
          ),
        )
        return new Result(true, 'db mongo emptying completed', {})
      },
    }),
  )
