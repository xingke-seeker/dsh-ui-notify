/**
 * Durable notification preferences for the completion-sound plugin. Standalone
 * distribution stores them in browser `localStorage` (no Host settings
 * dependency), so this module owns the schema, defaults, and the storage
 * round-trip the client half reads and writes.
 */

import z from '@deepseek-ai/schemastery'

/** Selectable embedded sounds; 'none' silences the completion reminder. */
export const NOTIFY_SOUNDS = ['none', 'a', 'b', 'c'] as const

/** One selectable notification sound. */
export type NotifySound = typeof NOTIFY_SOUNDS[number]

/** Which turn completions ring. */
export const NOTIFY_REMIND = ['background-only', 'any'] as const

/** One completion-reminder scope. */
export type NotifyRemind = typeof NOTIFY_REMIND[number]

/** Durable notification section shared by the schema and the browser scope. */
export interface NotifySettings {
  /** Master switch; disabled never rings. */
  enabled: boolean
  /** Embedded sound to play; 'none' silences even when enabled. */
  sound: NotifySound
  /** Element volume, 0..1. */
  volume: number
  /** 'background-only' rings sessions the Host marks completed (not selected); 'any' rings every turn end. */
  remind: NotifyRemind
  /** Turns shorter than this (ms) never ring. */
  minTurnMs: number
}

/**
 * Durable notification schema; the standalone client validates every
 * `localStorage` round-trip through it so a corrupt or hand-edited value
 * falls back to defaults instead of reaching the player.
 */
export const NotifySettingsSchema: z<NotifySettings> = z.object({
  enabled: z.boolean().default(true),
  sound: z.union([...NOTIFY_SOUNDS]).default('a'),
  volume: z.number().min(0).max(1).default(0.5),
  remind: z.union([...NOTIFY_REMIND]).default('background-only'),
  minTurnMs: z.natural().default(0),
})

/** The resolved defaults the schema applies to an empty section. */
export const DEFAULT_NOTIFY_SETTINGS: NotifySettings = {
  enabled: true,
  sound: 'a',
  volume: 0.5,
  remind: 'background-only',
  minTurnMs: 0,
}

/** `localStorage` key for the standalone settings document. */
export const NOTIFY_STORAGE_KEY = 'dsh-ui-notify.settings'

/** Storage backend the settings round-trip reads and writes. */
export interface NotifyStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/**
 * Read the persisted settings, validating against the schema. Any parse or
 * validation failure — corrupt JSON, unknown sound, out-of-range volume, or a
 * storage backend that throws (private mode) — returns the defaults.
 * @param storage - storage backend; defaults to the browser's `localStorage`.
 * @returns the resolved settings.
 */
export function loadNotifySettings(storage: NotifyStorage = globalThis.localStorage): NotifySettings {
  try {
    const raw = storage.getItem(NOTIFY_STORAGE_KEY)
    if (raw === null) return DEFAULT_NOTIFY_SETTINGS
    return NotifySettingsSchema(JSON.parse(raw)) as never
  } catch {
    return DEFAULT_NOTIFY_SETTINGS
  }
}

/**
 * Persist the settings. A failing backend (quota, private mode) is a silent
 * no-op — the in-memory value still drives the session, only durability is lost.
 * @param settings - resolved settings to persist.
 * @param storage - storage backend; defaults to the browser's `localStorage`.
 */
export function saveNotifySettings(settings: NotifySettings, storage: NotifyStorage = globalThis.localStorage): void {
  try {
    storage.setItem(NOTIFY_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage failure only disables durability, never the in-session behavior.
  }
}
