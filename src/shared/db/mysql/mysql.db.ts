import {
  FileMigrationProvider,
  Kysely,
  Migrator,
  MysqlDialect,
  sql,
} from 'kysely'
import { createPool } from 'mysql2'
import type { PoolOptions, Pool } from 'mysql2'
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

const currentPath = getCurrentPath(import.meta.url)

export type MysqlKyselyDatabase = {
  baseTable: BaseTable
}
export const mysqlDb = (dependencies: Dependencies) =>
  createDatabase<
    DatabaseName.MYSQL,
    Kysely<MysqlKyselyDatabase>,
    PoolOptions,
    { db: Kysely<MysqlKyselyDatabase>; migrator: Migrator; pool: Pool }
  >(
    {
      user: dependencies.config.DB_MYSQL_USER,
      password: dependencies.config.DB_MYSQL_PASSWORD,
      database: dependencies.config.DB_MYSQL_DATABASE,
      connectionLimit: 10,
      ...(dependencies.config.APP_ENV === AppEnv.docker
        ? { host: dependencies.config.DB_MYSQL_HOST }
        : {
            host: 'localhost',
            port: dependencies.config.DB_MYSQL_PORT_EXPOSED,
          }),
    },
    (state) => ({
      name: DatabaseName.MYSQL,
      getHost: () => state.config.host!,
      getInstance: () => {
        logger.debug('database mysql getting instance...', state.config, {
          pretty: true,
        })
        if (state.connected === false) {
          return new Result(
            false,
            'db mysql not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }
        return new Result(true, 'db mysql instance got', state.data.db)
      },
      connect: async () => {
        if (state.connected === true) {
          return new Result(
            false,
            'db mysql already connected',
            {},
            'DB_ALREADY_CONNECTED_ERROR',
          )
        }
        const pool = createPool(state.config)
        await new Promise((resolve, reject) =>
          pool.getConnection((error, connection) =>
            error !== null ? reject(error) : resolve(connection),
          ),
        )
        const db = new Kysely<MysqlKyselyDatabase>({
          dialect: new MysqlDialect({
            pool: pool,
          }),
        })
        state.connect({
          pool,
          db,
          migrator: new Migrator({
            db: db,
            provider: new FileMigrationProvider({
              fs: promises,
              path,
              migrationFolder: path.join(currentPath, './migrations'),
            }),
          }),
        })
        return new Result(true, 'db mysql connected', {})
      },
      disconnect: async () => {
        if (state.connected === false) {
          return new Result(
            false,
            'db mysql not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }
        await state.data.db.destroy()
        state.disconnect()
        return new Result(true, 'db mysql disconnected', {})
      },
      migrateToLatest: async () => {
        if (state.connected === false) {
          return new Result(
            false,
            'db mysql not connected',
            {},
            'DB_NOT_CONNECTED_ERROR',
          )
        }
        const { error, results } = await state.data.migrator.migrateToLatest()
        results?.forEach((it) => {
          if (it.status === 'Success') {
            logger.info(
              `db mysql migration"${it.migrationName}" was executed successfully`,
            )
          } else if (it.status === 'Error') {
            logger.error(
              `db mysql migration failed to execute migration "${it.migrationName}"`,
            )
          }
        })
        if (error !== undefined) {
          return new Result(
            false,
            'db mysql migration failed',
            results,
            'DB_MIGRATION_ERROR',
            error,
          )
        }
        return new Result(true, 'db mysql migration finished', {})
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
        const result = await sql<{ tableName: keyof MysqlKyselyDatabase }>`
        SELECT table_name AS tableName
        FROM information_schema.tables
        WHERE table_schema = ${state.config.database}
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('kysely_migration', 'kysely_migration_lock')
      `.execute(state.data.db)
        await Promise.all(
          result.rows.map((row) =>
            state.data.db.deleteFrom(row.tableName).execute(),
          ),
        )
        return new Result(true, 'db mysql emptying completed', {})
      },
    }),
  )
