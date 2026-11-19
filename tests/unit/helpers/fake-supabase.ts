import { vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface QueryCall {
  table: string
  op: 'select' | 'insert' | 'update' | 'delete' | 'upsert'
  payload?: unknown
  filters: Array<[string, string, unknown]>
  single: boolean
}

export type Result = { data?: unknown; error?: { message: string; code?: string } | null }
export type Handler = (call: QueryCall) => Result | Promise<Result>

/**
 * Client Supabase palsu: setiap query yang di-await memanggil `handler` dengan
 * tabel, operasi, payload, dan filter. `rpc` memanggil `rpcHandler`.
 */
export function fakeSupabase(
  handler: Handler,
  rpcHandler: (fn: string, args: unknown) => Result | Promise<Result> = () => ({ data: null, error: null }),
  log: string[] = [],
) {
  const calls: QueryCall[] = []

  function builder(table: string) {
    const call: QueryCall = { table, op: 'select', filters: [], single: false }
    const b: Record<string, unknown> = {}
    const chain = (fn: (...a: unknown[]) => void) => (...a: unknown[]) => { fn(...a); return b }
    b.select = chain(() => { /* select setelah insert/update tetap op tsb */ })
    b.insert = chain((p) => { call.op = 'insert'; call.payload = p })
    b.upsert = chain((p) => { call.op = 'upsert'; call.payload = p })
    b.update = chain((p) => { call.op = 'update'; call.payload = p })
    b.delete = chain(() => { call.op = 'delete' })
    for (const f of ['eq', 'neq', 'in', 'order', 'limit']) {
      b[f] = chain((col, val) => { call.filters.push([f, String(col), val]) })
    }
    b.single = chain(() => { call.single = true })
    b.maybeSingle = chain(() => { call.single = true })
    b.then = (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) => {
      calls.push(call)
      log.push(`${call.op}:${table}`)
      return Promise.resolve(handler(call)).then(r => ({ data: null, error: null, ...r })).then(resolve, reject)
    }
    return b
  }

  const rpc = vi.fn(async (fn: string, args: unknown) => {
    log.push(`rpc:${fn}`)
    return { data: null, error: null, ...(await rpcHandler(fn, args)) }
  })

  const client = { from: vi.fn((t: string) => builder(t)), rpc } as unknown as SupabaseClient
  return { client, calls, log, rpc }
}
