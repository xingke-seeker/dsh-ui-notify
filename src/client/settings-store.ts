/**
 * Notifications row store: the standalone settings source of truth, persisted
 * to browser localStorage. The plugin's apply-world change listener is the
 * only writer; the row component reads via props.useStore and writes through
 * the injected face. There is no loading/unavailable axis — localStorage is
 * synchronous and always answers, so the row renders the resolved settings
 * immediately.
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client'
import { DEFAULT_NOTIFY_SETTINGS, type NotifySettings } from '../notify-settings.ts'

/** Store state: the resolved notification settings, ready immediately. */
export interface NotifyRowState {
  /** Resolved settings (localStorage value or schema defaults). */
  settings: NotifySettings
}

/** Declared action shape giving the exported factory a stable return type. */
type NotifyRowActions = {
  set: (draft: NotifyRowState, next: NotifySettings) => void
}

/**
 * Declares the Notifications row state and write surface.
 * @returns the store handle.
 */
export function createNotifyRowStore(): EngineStoreHandle<NotifyRowState, NotifyRowActions> {
  return defineStore({
    init: (): NotifyRowState => ({ settings: DEFAULT_NOTIFY_SETTINGS }),
    actions: {
      set: (d, next) => {
        d.settings = next
      },
    },
  })
}
