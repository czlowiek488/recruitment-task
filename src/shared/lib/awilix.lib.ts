import * as awilix from 'awilix'

export * from 'awilix'

export type DependencyProxyHandlerOptions = {
  dependencyName: string
}

export const asProxied = <TFunction extends (...args: any) => any>(
  fun: ((...args: any) => any) | (new (...args: any) => any),
  proxies: ((options: DependencyProxyHandlerOptions) => ProxyHandler<any>)[],
): awilix.BuildResolver<ReturnType<TFunction>> =>
  awilix.asFunction<ReturnType<TFunction>>(
    proxies.reduce(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (target: any, handler: TFunction) => (some: any) =>
        new Proxy(target(some), handler({ dependencyName: fun.name })),
      fun.prototype === undefined
        ? fun
        : (...classConstructorArgs: any): any =>
            new (fun as new (...args: any) => any)(...classConstructorArgs),
    ) as any,
  )
