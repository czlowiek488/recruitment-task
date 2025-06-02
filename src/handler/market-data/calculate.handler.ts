import { createHandler } from '../../shared/structure/handler.structure'
import { HandlerName } from '../../shared/enum/handler-name.enum'
import { Result } from '../../shared/lib/result.lib'

export const marketDataCalculateHandler = createHandler<{}, {}, any>(
  HandlerName.INTERNAL_HEALTH_CHECK,
  () => async () => {
    return new Result(true, `handler internal health check succeed`, {})
  },
)
