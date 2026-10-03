import { Liveblocks } from "@liveblocks/node"

let _liveblocks: Liveblocks | null = null

function getLiveblocks(): Liveblocks {
  if (!_liveblocks) {
    _liveblocks = new Liveblocks({
      secret: process.env.LIVEBLOCKS_SECRET_KEY!,
    })
  }
  return _liveblocks
}

export const liveblocks = new Proxy({} as Liveblocks, {
  get(_target, prop, receiver) {
    return Reflect.get(getLiveblocks(), prop, receiver)
  },
})
