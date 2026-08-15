/**
 * Notification settings schema and localStorage round-trip: defaults, parse,
 * rejection, and the fallback-to-defaults contract for corrupt storage.
 */
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_NOTIFY_SETTINGS, loadNotifySettings, NOTIFY_STORAGE_KEY, NotifySettingsSchema,
  saveNotifySettings, type NotifySettings, type NotifyStorage,
} from '../src/notify-settings.ts'

/**
 * Call the schema on a partial or deliberately invalid section. The schema
 * callable is typed over the resolved {@link NotifySettings}, while its
 * runtime validation admits partial sections and applies defaults — cast the
 * input so rejection cases stay expressible.
 */
function parse(input: unknown): NotifySettings {
  return NotifySettingsSchema(input as never)
}

/** In-memory storage backend for the round-trip tests. */
function memoryStorage(initial: Record<string, string> = {}): NotifyStorage & { data: Record<string, string> } {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = value },
  }
}

describe('NotifySettingsSchema', () => {
  it('applies defaults to an empty section', () => {
    expect(parse({})).toEqual({
      enabled: true,
      sound: 'a',
      volume: 0.5,
      remind: 'background-only',
      minTurnMs: 0,
    })
  })

  it('round-trips a full section', () => {
    expect(parse({
      enabled: false,
      sound: 'c',
      volume: 0.8,
      remind: 'any',
      minTurnMs: 1_000,
    })).toEqual({
      enabled: false,
      sound: 'c',
      volume: 0.8,
      remind: 'any',
      minTurnMs: 1_000,
    })
  })

  it('rejects an unknown sound', () => {
    expect(() => parse({ sound: 'x' })).toThrow()
  })

  it('rejects an unknown remind scope', () => {
    expect(() => parse({ remind: 'foreground' })).toThrow()
  })

  it('rejects an out-of-range volume', () => {
    expect(() => parse({ volume: 1.5 })).toThrow()
    expect(() => parse({ volume: -0.1 })).toThrow()
  })

  it('rejects a negative minTurnMs', () => {
    expect(() => parse({ minTurnMs: -1 })).toThrow()
  })
})

describe('notify settings storage', () => {
  it('loads defaults from empty storage', () => {
    const storage = memoryStorage()
    expect(loadNotifySettings(storage)).toEqual(DEFAULT_NOTIFY_SETTINGS)
  })

  it('round-trips a persisted document', () => {
    const settings: NotifySettings = {
      enabled: false, sound: 'b', volume: 0.3, remind: 'any', minTurnMs: 500,
    }
    const storage = memoryStorage()
    saveNotifySettings(settings, storage)
    expect(loadNotifySettings(storage)).toEqual(settings)
    expect(JSON.parse(storage.data[NOTIFY_STORAGE_KEY] ?? '{}')).toEqual(settings)
  })

  it('falls back to defaults on corrupt JSON', () => {
    const storage = memoryStorage({ [NOTIFY_STORAGE_KEY]: '{not json' })
    expect(loadNotifySettings(storage)).toEqual(DEFAULT_NOTIFY_SETTINGS)
  })

  it('falls back to defaults on an invalid section', () => {
    const storage = memoryStorage({ [NOTIFY_STORAGE_KEY]: JSON.stringify({ sound: 'x' }) })
    expect(loadNotifySettings(storage)).toEqual(DEFAULT_NOTIFY_SETTINGS)
  })

  it('treats a throwing backend as empty and a no-op write', () => {
    const throwing: NotifyStorage = {
      getItem: () => { throw new Error('private mode') },
      setItem: () => { throw new Error('private mode') },
    }
    expect(loadNotifySettings(throwing)).toEqual(DEFAULT_NOTIFY_SETTINGS)
    expect(() => saveNotifySettings(DEFAULT_NOTIFY_SETTINGS, throwing)).not.toThrow()
  })
})
