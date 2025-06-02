import { SecureHeaders } from '../enum/secure-headers.enum'
import { SecureKeys } from '../enum/secure-keys.enum'

export const buildReplacementString = (
  reason: 'SECURE' | 'CIRCULAR',
  key: string,
  value: unknown,
): string => `_${reason}_<${typeof value}>${key}_`

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value
export function getCircularReplacer() {
  const ancestors: any[] = []

  return function (key: any, value: any) {
    if (typeof value !== 'object' || value === null) {
      return value
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) {
      ancestors.pop()
    }
    if (ancestors.includes(value)) {
      return buildReplacementString('CIRCULAR', key, value)
    }
    ancestors.push(value)
    return value
  }
}

const securedKeys: string[] = [
  ...Object.values(SecureKeys),
  ...Object.values(SecureHeaders),
]

export const getSecureReplacer =
  (keys: string[]) =>
  (key: string, value: any): string =>
    keys.includes(key) ? buildReplacementString('SECURE', key, value) : value

export const js2SecureJson =
  (secureReplacer: any, circularReplacer: any) =>
  (object: any): string => {
    if (typeof object === 'string') {
      return object
    }
    try {
      const result = JSON.stringify(object, secureReplacer)
      return result
    } catch {
      const result = JSON.stringify(object, function (key, value) {
        return [circularReplacer, secureReplacer].reduce(
          (acc, replacer) => replacer.bind(this)(key, acc),
          value,
        )
      })
      return result
    }
  }

export const secureJsonStringify = js2SecureJson(
  getSecureReplacer(securedKeys),
  getCircularReplacer(),
)
