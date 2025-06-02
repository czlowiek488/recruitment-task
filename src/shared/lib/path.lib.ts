import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const getCurrentPath = (url: string): string => {
  return dirname(fileURLToPath(url))
}
