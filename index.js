import { randomUUID } from 'node:crypto'

export const name = 'dsh-session-rotate-on-compact'
export const inject = ['llm']

// Original DSH Session.id -> outbound session id used for the actual LLM request.
const stateBySessionId = new Map()

function getState(sessionId) {
  const key = String(sessionId)
  let state = stateBySessionId.get(key)
  if (!state) {
    state = {
      outboundSessionId: key,
      rotation: 0,
    }
    stateBySessionId.set(key, state)
  }
  return state
}

function isCompactionRequest(options) {
  return options?.purpose === 'compaction'
}

export function apply(ctx) {
  // llm/stream is a waterfall. We call the service recursively with a rewritten
  // GenerateOptions object, while keeping a guard active for the nested dispatch.
  // The guard must stay active for the lifetime of the returned async iterable.
  let forwarding = false

  ctx.on('llm/stream', (options, next) => {
    if (forwarding || options?.sessionId === undefined || isCompactionRequest(options)) {
      return next()
    }

    const originalSessionId = String(options.sessionId)
    const state = getState(originalSessionId)

    // Before the first successful compaction, preserve DSH's original session id.
    if (state.outboundSessionId === originalSessionId) {
      return next()
    }

    const rewritten = {
      ...options,
      sessionId: state.outboundSessionId,
    }

    return (async function* () {
      forwarding = true
      try {
        yield* ctx.llm.stream(rewritten)
      } finally {
        forwarding = false
      }
    })()
  }, { global: true })

  // Both automatic and manual compaction finish here. Only a successful
  // compaction rotates the outbound session id. Failed/aborted compactions do not.
  ctx.on('session/event', (session, event) => {
    if (event.type !== 'compaction/end') return
    if (event.data?.error) return

    const sessionId = String(session.id)
    const state = getState(sessionId)
    state.outboundSessionId = `dsh-compact-${randomUUID()}`
    state.rotation += 1

    console.log(
      `[${name}] session ${sessionId}: ` +
      `rotated outbound session (#${state.rotation}) -> ${state.outboundSessionId}`,
    )
  }, { global: true })

  ctx.on('session/disposed', (session) => {
    stateBySessionId.delete(String(session.id))
  }, { global: true })
}
