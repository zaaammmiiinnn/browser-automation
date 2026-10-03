import Browserbase from "@browserbasehq/sdk"

let _browserbase: Browserbase | null = null

function getBrowserbase(): Browserbase {
  if (!_browserbase) {
    _browserbase = new Browserbase({
      apiKey: process.env.BROWSERBASE_API_KEY!,
    })
  }
  return _browserbase
}

// Server-only Browserbase client for observability calls (session replays, logs).
// It carries the secret API key, so it must never be imported into client code.
export const browserbase = new Proxy({} as Browserbase, {
  get(_target, prop, receiver) {
    return Reflect.get(getBrowserbase(), prop, receiver)
  },
})
