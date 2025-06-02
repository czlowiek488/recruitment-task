export type MergeUnion<T> = {
  [K in keyof T]: T[K]
} & {
  [K in Exclude<AllKeys<T>, keyof T>]?: ValueOf<T, K>
}

type AllKeys<T> = T extends any ? keyof T : never

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
type ValueOf<T, K> = T extends { [P in K]?: any } ? T[K] : never
