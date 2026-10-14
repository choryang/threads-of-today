import fsDriver from 'unstorage/drivers/fs'
import memoryDriver from 'unstorage/drivers/memory'
import upstashDriver from 'unstorage/drivers/upstash'
import { KV_PREFIX, kvCredentials } from '../utils/kv'

/** useStorage('kv')에 저장소를 붙인다. 환경 변수는 실행 시점에 읽어야 해서 nuxt.config가 아니라 플러그인에서 한다. */
export default defineNitroPlugin(() => {
  const storage = useStorage()
  const cred = kvCredentials()
  if (cred) storage.mount('kv', upstashDriver({ ...cred, base: KV_PREFIX }))
  else if (import.meta.dev) storage.mount('kv', fsDriver({ base: '.data/kv' }))
  else storage.mount('kv', memoryDriver())
})
