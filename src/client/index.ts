/**
 * Completion-sound notification plugin, browser half: watches the sessions
 * list store for the running→idle edge (a session's output finishing) and
 * plays an embedded chime, and registers the Notifications row in General
 * settings. Settings persist in browser localStorage (standalone plugin, no
 * Host settings dependency). Pure client-side consumption: no host event, no
 * session-log entry, and no model-visible change.
 */
import type { BoundActions } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the `settings.general.item` slot type (declared in the
// settings domain's slot contract) and the ctx.locale Context merge through
// the Client assembly boundary. No value import — the standalone plugin never
// uses the Host settings transport.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import {
  loadNotifySettings, saveNotifySettings, type NotifySettings,
} from '../notify-settings.ts'
import { createNotifyPlayer } from './audio.ts'
import { collectCompletionEdges } from './completion-edge.ts'
import { createNotifyRowStore } from './settings-store.ts'
import { NotifyRow, type NotifyRowInjected } from './NotifyRow.tsx'
import { en, zh, type NotifyKey } from './locales.ts'

export { NotifyRow, type NotifyRowInjected } from './NotifyRow.tsx'

/** Locale namespace owned by this plugin. */
const NS = 'settings.notify'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The Notifications row's copy. */
    'settings.notify': NotifyKey
  }
}

/** Required services for the completion watch, the settings row, and copy. */
export const inject = ['sessions', 'slots', 'locale']

/**
 * Client plugin body: the completion-sound watch and the Notifications row.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  const player = createNotifyPlayer()
  const store = createNotifyRowStore()
  let current: NotifySettings = loadNotifySettings()

  // Completion watch: fold session-list snapshots; the first observation only
  // seeds the running bits, later running→idle edges ring when enabled.
  let prevRunning = new Map<string, boolean>()
  let prevSince = new Map<string, number>()
  const onListChange = (): void => {
    const snapshot = ctx.sessions.list.getSnapshot()
    const { edges, nextRunning, nextSince } = collectCompletionEdges(
      prevRunning,
      prevSince,
      Object.values(snapshot.byId),
      {
        now: Date.now(),
        minTurnMs: current.minTurnMs,
        remind: current.remind,
      },
    )
    prevRunning = nextRunning
    prevSince = nextSince
    if (!current.enabled || current.sound === 'none') return
    if (edges.length > 0) player.play(current.sound, current.volume)
  }
  ctx.effect(() => {
    onListChange()
    return ctx.sessions.list.subscribe(onListChange)
  }, 'ui-notify: completion watch')

  // Unlock audio on the first user gesture (autoplay policy); an unlock with
  // a queued rejection from an earlier completion then flushes it.
  const unlock = (): void => { player.unlock() }
  ctx.effect(() => {
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, 'ui-notify: audio unlock')

  // The settings source of truth: persist every write, then mirror it into the
  // row store. Writes are synchronous, so the completion watch reads `current`
  // and the row reads the store — both stay consistent through `commit`.
  let bound: BoundActions<typeof store> | undefined
  const commit = (next: NotifySettings): void => {
    current = next
    saveNotifySettings(next)
    bound?.set(next)
  }
  const injected = (actions: BoundActions<typeof store>): NotifyRowInjected => {
    bound = actions
    bound.set(current)
    return {
      setEnabled: (enabled) => { commit({ ...current, enabled }) },
      setSound: (sound) => { commit({ ...current, sound }) },
      setVolume: (volume) => { commit({ ...current, volume }) },
      setRemind: (remind) => { commit({ ...current, remind }) },
      preview: () => {
        if (current.sound !== 'none') player.play(current.sound, current.volume)
      },
    }
  }
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'notify',
    order: 20,
    store,
    locale: NS,
    inject: injected,
  }, NotifyRow))
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-notify: dictionaries')
}
