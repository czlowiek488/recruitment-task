import Redis from 'ioredis'
import type { RedisOptions } from 'ioredis'
import { AppEnv } from '../../enum/app-env.enum'
import { logger } from '../../lib/logger.lib'
import { Result } from '../../lib/result.lib'
import { createDatabase } from '../db.manager'
import { DatabaseName } from '../../enum/database-name.enum'
import type { Dependencies } from '../../../app'

export const redisDb = (dependencies: Dependencies) =>
  createDatabase<
    DatabaseName.REDIS,
    Redis,
    { options: RedisOptions },
    { client: Redis }
  >(
    {
      options: {
        host:
          dependencies.config.APP_ENV === AppEnv.docker
            ? dependencies.config.DB_REDIS_HOST
            : `127.0.0.1`,
        port:
          dependencies.config.APP_ENV === AppEnv.docker
            ? undefined
            : dependencies.config.DB_REDIS_PORT_EXPOSED,
        password: dependencies.config.DB_REDIS_PASSWORD,
      },
    },
    (state) => ({
      name: DatabaseName.REDIS,
      getHost: () => state.config.options.host!,
      getInstance: () => {
        logger.notice('getInstance', { connected: state.connected })
        if (state.connected === false) {
          return new Result(
            false,
            'db redis not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }
        return new Result(true, 'db redis instance got', state.data.client)
      },
      connect: async () => {
        if (state.connected === true) {
          return new Result(
            false,
            'db redis already connected',
            {},
            'DB_ALREADY_CONNECTED_ERROR',
          )
        }
        logger.debug('database redis connecting...', state.config, {
          pretty: true,
        })
        const client = new Redis(state.config.options)
        await client.ping()
        state.connect({ client })
        logger.debug('database redis connected')
        return new Result(true, 'db redis connected', {})
      },
      disconnect: async () => {
        if (state.connected === false) {
          return new Result(
            false,
            'db redis not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }
        logger.debug('database redis disconnecting...')
        await state.data.client.quit()
        logger.debug('database redis disconnected')
        state.disconnect()
        return new Result(true, 'db redis disconnected', {})
      },
      emptyDb: async () => {
        if (dependencies.config.EMPTYING_DATABASE_ALLOWED === false) {
          return new Result(
            false,
            'db redis emptying disallowed',
            {},
            'DB_EMPTYING_DISALLOWED_ERROR',
          )
        }

        if (state.connected === false) {
          return new Result(
            false,
            'db redis not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }
        const result = await state.data.client.flushdb()
        if (result !== 'OK') {
          return new Result(
            false,
            'db redis emptying failed',
            { result },
            'DB_EMPTYING_ERROR',
          )
        }
        logger.info('Redis database flushed')
        return new Result(true, 'db redis emptying completed', {})
      },
    }),
  )
