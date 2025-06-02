import type { Handler } from 'express'
import bodyParser from 'body-parser'

export const bodyParserMiddleware = (): Handler => bodyParser.json({})
