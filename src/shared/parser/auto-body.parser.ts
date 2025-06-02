import querystring from 'querystring'
import { logger } from '../lib/logger.lib'

export const autoBodyParse = (body: string | { [key: string]: any }) => {
  if (typeof body === 'object') {
    return body
  }
  if (typeof body === 'string') {
    logger.info('request body is not an object, trying to JSON.parse...')
    try {
      return JSON.parse(body)
    } catch {
      logger.info('request body JSON.parse failed, trying querystring.parse...')
      try {
        return querystring.parse(body)
      } catch {
        logger.info(
          'request body JSON.parse failed and querystring.parse failed!',
        )
      }
    }
  }
  return body
}
