import { AsyncLocalStorage } from 'async_hooks'

export interface RequestContext {
  requestId?: string
  organizationId?: string
  actorId?: string
  actorType?: 'USER' | 'REVIEWER'
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>()

export function runWithRequestContext<T>(
  context: RequestContext,
  fn: () => T
): T {
  return asyncLocalStorage.run(context, fn)
}

export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore()
}

export function updateRequestContext(
  partial: Partial<RequestContext>
): void {
  const store = asyncLocalStorage.getStore()
  if (!store) return

  if (partial.requestId !== undefined) {
    store.requestId = partial.requestId
  }
  if (partial.organizationId !== undefined) {
    store.organizationId = partial.organizationId
  }
  if (partial.actorId !== undefined) {
    store.actorId = partial.actorId
  }
  if (partial.actorType !== undefined) {
    store.actorType = partial.actorType
  }
}
