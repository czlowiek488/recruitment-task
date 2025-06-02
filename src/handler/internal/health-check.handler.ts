import { createHandler } from '../../shared/structure/handler.structure'
import { HandlerName } from '../../shared/enum/handler-name.enum'
import { Result } from '../../shared/lib/result.lib'
import type { DatabaseConnectionStatus } from '../../shared/db/db.manager'

type InternalHealthCheckHandlerResult = {
  databaseConnectionStatus?: DatabaseConnectionStatus
  networkStatus?: boolean
}

export const internalHealthCheckHandler = createHandler<
  { checkDatabase: boolean; checkNetwork: boolean },
  InternalHealthCheckHandlerResult,
  any
>(HandlerName.INTERNAL_HEALTH_CHECK, (dependencies) => async (payload) => {
  const result: InternalHealthCheckHandlerResult = {}
  if (payload.checkDatabase === true) {
    result.databaseConnectionStatus =
      dependencies.dbManager.getConnectionStatus()
  }
  if (payload.checkNetwork === true) {
    const getGoogleResult = await dependencies.baseIntegration.getGoogle()
    result.networkStatus = getGoogleResult.succeed
  }
  return new Result(true, `handler internal health check succeed`, result)
})
