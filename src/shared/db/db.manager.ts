import type { Dependencies } from '../../app'
import type { DatabaseName } from '../enum/database-name.enum'
import { Result } from '../lib/result.lib'
import type { ErrorName, FunctionResult } from '../lib/result.lib'

export type DatabaseState<
  TConfig extends { [key: string]: any },
  TData extends { [key: string]: any },
  TConnected extends boolean,
> = {
  connected: TConnected
  config: TConfig
  data: TConnected extends true ? TData : never
  connect: (data: TData) => void
  disconnect: () => void
}

export const createDatabase = <
  TDatabaseName extends DatabaseName,
  TInstance extends any,
  TConfig extends { [key: string]: any },
  TData extends { [key: string]: any },
>(
  config: TConfig,
  implementation: (
    state: DatabaseState<TConfig, TData, boolean>,
  ) => Omit<Database<TInstance, TDatabaseName, any>, 'state'>,
) => {
  const state = {
    config,
    connected: false as boolean,
    data: undefined as any,
    connect: (data: TData) => {
      state.connected = true
      state.data = data
    },
    disconnect: () => {
      state.connected = false
    },
  } satisfies DatabaseState<TConfig, TData, boolean>
  const database = implementation(state) as Database<
    TInstance,
    TDatabaseName,
    any
  >
  database.state = state
  return database
}

export type Database<
  TInstance extends any,
  TDatabaseName extends DatabaseName,
  TMigrationResult extends { [key: string]: any } | null = null,
> = {
  name: TDatabaseName
  state: DatabaseState<any, any, boolean>
  getHost: () => string
  getInstance: () => FunctionResult<TInstance, 'DB_NOT_CONNECTED_ERROR'>
  connect: () => FunctionResult<
    Promise<{}>,
    'DB_ALREADY_CONNECTED_ERROR' | 'DB_CONNECTION_ERROR'
  >
  disconnect: () => FunctionResult<
    Promise<{}> | {},
    'DB_NOT_CONNECTED_ERROR' | 'DB_DISCONNECTION_ERROR'
  >
  emptyDb: () => FunctionResult<
    Promise<{}>,
    | 'DB_EMPTYING_ERROR'
    | `DB_EMPTYING_DISALLOWED_ERROR`
    | 'DB_NOT_CONNECTED_ERROR'
  >
} & (TMigrationResult extends null
  ? {}
  : {
      migrateToLatest: () => FunctionResult<
        Promise<TMigrationResult>,
        'DB_MIGRATION_ERROR' | 'DB_NOT_CONNECTED_ERROR'
      >
    })
type DatabaseFactory<
  TDatabaseName extends DatabaseName,
  TDatabase extends Database<any, TDatabaseName>,
> = (dependencies: Dependencies) => TDatabase

type DatabaseFactorySet<TDatabaseName extends DatabaseName> = {
  [key in TDatabaseName]: DatabaseFactory<key, Database<any, key>>
}
export type DatabaseConnectionStatus = {
  [key in DatabaseName]: boolean
}
export const createDbManager =
  <
    TDatabaseName extends DatabaseName,
    TFactorySet extends DatabaseFactorySet<TDatabaseName>,
    TDatabaseSet extends {
      [K in keyof TFactorySet]: ReturnType<TFactorySet[K]>
    },
  >(
    databaseSet: TFactorySet,
  ) =>
  (dependencies: Dependencies) => {
    const state: {
      databaseSet: TDatabaseSet
      connected: boolean
    } = { connected: false, databaseSet } as any
    try {
      Object.keys(databaseSet).forEach((databaseName) => {
        ;(state.databaseSet as any)[databaseName] = (state.databaseSet as any)[
          databaseName
        ](dependencies)
      })
    } catch (error) {
      throw new Result(
        false,
        'manager db initializing failed',
        {},
        'DB_MANAGER_INITIALIZATION_ERROR',
        error,
      ).destroyToThrow()
    }
    const forEach = async <TErrorName extends ErrorName>(
      callback: (
        db: TDatabaseSet[TDatabaseName],
        name: TDatabaseName,
      ) => FunctionResult<Promise<{}> | {}, TErrorName>,
    ): FunctionResult<
      Promise<{}>,
      | 'DB_MANAGER_FOR_EACH_LOCAL_ERROR'
      | 'DB_MANAGER_FOR_EACH_GLOBAL_ERROR'
      | TErrorName
    > => {
      try {
        for (const [name, db] of Object.entries(state.databaseSet) as [
          TDatabaseName,
          TDatabaseSet[TDatabaseName],
        ][]) {
          try {
            const result = await callback(db, name)
            if (result.succeed === false) {
              return new Result(
                false,
                'manager db for each local failed',
                { name },
                'DB_MANAGER_FOR_EACH_LOCAL_ERROR',
                result,
              )
            }
          } catch (error) {
            return new Result(
              false,
              'manager db for each local failed',
              { name },
              'DB_MANAGER_FOR_EACH_GLOBAL_ERROR',
              error,
            )
          }
        }
        return new Result(true, 'manager db for each global succeed', {})
      } catch (error) {
        return new Result(
          false,
          'manager db for each global failed',
          {},
          'DB_MANAGER_FOR_EACH_GLOBAL_ERROR',
          error,
        )
      }
    }

    return {
      getConnectionStatus: () =>
        Object.keys(state.databaseSet).reduce<{
          [key in DatabaseName]: boolean
        }>(
          (acc, name) => ({
            ...acc,
            [name]:
              state.databaseSet[name as keyof typeof state.databaseSet].state
                .connected,
          }),
          {} as any,
        ),
      getInstance: <TName extends TDatabaseName>(
        name: TName,
      ): FunctionResult<
        ReturnType<TDatabaseSet[TName]['getInstance']> extends FunctionResult<
          infer T,
          any
        >
          ? T
          : never,
        'DB_NOT_CONNECTED_ERROR'
      > => {
        try {
          if (state.connected === false) {
            return new Result(
              false,
              'manager db connection failed',
              {},
              'DB_NOT_CONNECTED_ERROR',
            ) as any
          }
          return state.databaseSet[name].getInstance() as any
        } catch (error) {
          return new Result(
            false,
            'manager db connection failed',
            {},
            'DB_NOT_CONNECTED_ERROR',
            error,
          ) as any
        }
      },
      disconnectDatabases: async (): FunctionResult<
        Promise<{}>,
        `DB_DISCONNECTION_ERROR`
      > => {
        const forEachResult = await forEach(async (db) => db.disconnect())
        if (forEachResult.succeed === false) {
          return new Result(
            false,
            'manager db disconnection failed',
            {},
            'DB_DISCONNECTION_ERROR',
            forEachResult,
          )
        }
        return new Result(true, 'manager db disconnection succeed', {})
      },
      connectDatabases: async (): FunctionResult<
        Promise<{}>,
        'DB_MANAGER_CONNECTION_ERROR'
      > => {
        const forEachResult = await forEach(async (db) => db.connect())
        if (forEachResult.succeed === false) {
          return new Result(
            false,
            'manager db connection failed',
            {},
            'DB_MANAGER_CONNECTION_ERROR',
            forEachResult,
          )
        }
        state.connected = true
        return new Result(true, 'manager db connection succeed', forEachResult)
      },
      emptyDatabases: async (): FunctionResult<
        Promise<{}>,
        'DB_MANAGER_EMPTYING_ERROR'
      > => {
        const forEachResult = await forEach(async (db) => db.emptyDb())
        if (forEachResult.succeed === false) {
          return new Result(
            false,
            'manager db emptying failed',
            {},
            'DB_MANAGER_EMPTYING_ERROR',
            forEachResult,
          )
        }
        return new Result(true, 'manager db emptying succeed', {})
      },
      runMigrations: async (): FunctionResult<
        Promise<{}>,
        'DB_MANAGER_MIGRATION_ERROR'
      > => {
        const forEachResult = await forEach((db) => {
          if (
            'migrateToLatest' in db === false ||
            typeof db.migrateToLatest !== 'function'
          ) {
            return new Result(
              true,
              'manager db implementation does not have migration function',
              {},
            )
          }
          return db.migrateToLatest()
        })
        if (forEachResult.succeed === false) {
          return new Result(
            false,
            'manager db emptying failed',
            {},
            'DB_MANAGER_MIGRATION_ERROR',
            forEachResult,
          )
        }
        return new Result(true, 'manager db migrating succeed', {})
      },
      getHostNames: async (): FunctionResult<
        Promise<string[]>,
        'DB_MANAGER_GETTING_HOST_NAMES_ERROR'
      > => {
        const hostMap: string[] = []
        const forEachResult = await forEach((db) => {
          hostMap.push(db.getHost())
          return new Result(true, 'manager db host name found', {})
        })
        if (forEachResult.succeed === false) {
          return new Result(
            false,
            'manager db emptying failed',
            {},
            'DB_MANAGER_GETTING_HOST_NAMES_ERROR',
            forEachResult,
          )
        }
        return new Result(true, 'manager db get host names succeed', hostMap)
      },
    }
  }
