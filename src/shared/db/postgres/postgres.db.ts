import {
  FileMigrationProvider,
  Kysely,
  Migrator,
  PostgresDialect,
  sql,
} from 'kysely'
import { Pool } from 'pg'
import type { PoolClient, PoolConfig } from 'pg'
import { promises } from 'fs'
import path from 'path'
import type { BaseTable } from './table/base.table'
import { getCurrentPath } from '../../lib/path.lib'
import { AppEnv } from '../../enum/app-env.enum'
import { logger } from '../../lib/logger.lib'
import { Result } from '../../lib/result.lib'
import { createDatabase } from '../db.manager'
import { DatabaseName } from '../../enum/database-name.enum'
import type { Dependencies } from '../../../app'

export type PostgresKyselyDatabase = {
  baseTable: BaseTable
}

export const postgresDb = (dependencies: Dependencies) =>
  createDatabase<
    DatabaseName.POSTGRES,
    Kysely<PostgresKyselyDatabase>,
    PoolConfig,
    {
      db: Kysely<PostgresKyselyDatabase>
      migrator: Migrator
      pool: Pool
      client: PoolClient
    }
  >(
    {
      host:
        dependencies.config.APP_ENV === AppEnv.docker
          ? dependencies.config.DB_POSTGRES_HOST
          : `127.0.0.1`,
      port:
        dependencies.config.APP_ENV === AppEnv.docker
          ? undefined
          : dependencies.config.DB_POSTGRES_PORT_EXPOSED,
      user: dependencies.config.DB_POSTGRES_USER,
      password: dependencies.config.DB_POSTGRES_PASSWORD,
      database: dependencies.config.DB_POSTGRES_NAME,
    },
    (state) => ({
      name: DatabaseName.POSTGRES,
      getHost: () => state.config.host!,
      getInstance: () => {
        if (state.connected === false) {
          return new Result(
            false,
            'db postgres not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }
        return new Result(true, 'db postgres instance got', state.data.db)
      },
      connect: async () => {
        if (state.connected === true) {
          return new Result(
            false,
            'db postgres already connected',
            {},
            'DB_ALREADY_CONNECTED_ERROR',
          )
        }
        logger.debug('database postgres connecting...', state.config, {
          pretty: true,
        })
        const pool = new Pool(state.config)
        const client = await pool.connect()
        const db = new Kysely<PostgresKyselyDatabase>({
          dialect: new PostgresDialect({
            pool: pool,
          }),
        })
        const migrator = new Migrator({
          db,
          provider: new FileMigrationProvider({
            fs: promises,
            path,
            migrationFolder: path.join(
              getCurrentPath(import.meta.url),
              './migrations',
            ),
          }),
        })
        state.connect({ pool, db, client, migrator })
        return new Result(true, 'db postgres connected', {})
      },
      disconnect: () => {
        if (state.connected === false) {
          return new Result(
            false,
            'db postgres not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }
        state.data.client.release(false)
        state.disconnect()
        return new Result(true, 'db postgres disconnected', {})
      },
      migrateToLatest: async () => {
        if (state.connected === false) {
          return new Result(
            false,
            'db postgres not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }
        logger.info('database postgres migration started...')
        const { error, results } = await state.data.migrator.migrateToLatest()

        results?.forEach((it) => {
          if (it.status === 'Success') {
            logger.info(
              `migration "${it.migrationName}" was executed successfully`,
            )
          } else if (it.status === 'Error') {
            logger.error(`failed to execute migration "${it.migrationName}"`)
          }
        })

        logger.info('database postgres migration completed')
        if (error !== undefined) {
          return new Result(
            false,
            'db postgres migration failed',
            results,
            'DB_MIGRATION_ERROR',
            error,
          )
        }
        return new Result(true, 'db postgres migration finished', {})
      },
      emptyDb: async () => {
        if (dependencies.config.EMPTYING_DATABASE_ALLOWED === false) {
          return new Result(
            false,
            'db postgres emptying disallowed',
            {},
            'DB_EMPTYING_DISALLOWED_ERROR',
          )
        }
        if (state.connected === false) {
          return new Result(
            false,
            'db postgres not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }
        const result = await sql<{ tableName: keyof PostgresKyselyDatabase }>`
        SELECT tablename as "tableName"
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename NOT IN ('kysely_migration', 'kysely_migration_lock');
      `.execute(state.data.db)
        await Promise.all(
          result.rows.map((row) =>
            state.data.db.deleteFrom(row.tableName).execute(),
          ),
        )
        return new Result(true, 'db postgres emptying completed', {})
      },
    }),
  )
