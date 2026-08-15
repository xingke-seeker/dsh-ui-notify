/**
 * Notifications preference row registered into the General section item slot
 * (following the ui-theme Appearance row pattern): an enable toggle, a sound
 * selector with preview, a volume slider, and a remind-scope selector.
 * Registered by this package — the notification feature owns its own settings
 * surface. Writes route through the injected face into the localStorage-backed
 * store; the row reads resolved settings synchronously (no Host dependency).
 */
import clsx from 'clsx'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the `settings.general.item` slot type into the props chain.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { NotifyRemind, NotifySound } from '../notify-settings.ts'
import type { NotifyKey } from './locales.ts'
import type { createNotifyRowStore } from './settings-store.ts'
import css from './NotifyRow.module.css'

/** Injected business face: the settings writes and the preview play. */
export interface NotifyRowInjected {
  /** Toggle the master switch. */
  setEnabled: (enabled: boolean) => void
  /** Select the embedded sound. */
  setSound: (sound: NotifySound) => void
  /** Set the element volume. */
  setVolume: (volume: number) => void
  /** Select the remind scope. */
  setRemind: (remind: NotifyRemind) => void
  /** Play the current selection through the apply-world player. */
  preview: () => void
}

/** Full component props: runtime share + store share + locale seat + injected face. */
export type NotifyRowComponentProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createNotifyRowStore>>
  & PropsLocale<'settings.notify'> & NotifyRowInjected

/** Sound selector options in settings order. */
const SOUNDS: readonly NotifySound[] = ['none', 'a', 'b', 'c']

/** Remind-scope selector options in settings order. */
const REMINDS: readonly NotifyRemind[] = ['background-only', 'any']

/** Locale key for one sound option. */
function soundKey(sound: NotifySound): NotifyKey {
  return sound === 'none' ? 'notify.soundNone' : `notify.sound${sound.toUpperCase()}` as NotifyKey
}

/** Locale key for one remind option. */
function remindKey(remind: NotifyRemind): NotifyKey {
  return remind === 'background-only' ? 'notify.remindBackground' : 'notify.remindAny'
}

/**
 * Render the Notifications row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export function NotifyRow({ t, useStore, setEnabled, setSound, setVolume, setRemind, preview }: NotifyRowComponentProps) {
  const { settings } = useStore(s => s)
  return (
    <div className={css.row}>
      <div className={css.title}>{t('notify.title')}</div>
      <label className={css.field}>
        <span>{t('notify.enabled')}</span>
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(event) => { setEnabled(event.target.checked) }}
        />
      </label>
      <label className={css.field}>
        <span>{t('notify.sound')}</span>
        <select
          value={settings.sound}
          onChange={(event) => { setSound(event.target.value as NotifySound) }}
        >
          {SOUNDS.map(sound => (
            <option key={sound} value={sound}>{t(soundKey(sound))}</option>
          ))}
        </select>
        <button
          type="button"
          className={clsx(css.preview, settings.sound === 'none' && css.disabled)}
          disabled={settings.sound === 'none'}
          onClick={preview}
        >
          {t('notify.preview')}
        </button>
      </label>
      <label className={css.field}>
        <span>{t('notify.volume')}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.volume}
          onChange={(event) => { setVolume(Number(event.target.value)) }}
        />
        <span className={css.muted}>{Math.round(settings.volume * 100)}%</span>
      </label>
      <label className={css.field}>
        <span>{t('notify.remind')}</span>
        <select
          value={settings.remind}
          onChange={(event) => { setRemind(event.target.value as NotifyRemind) }}
        >
          {REMINDS.map(remind => (
            <option key={remind} value={remind}>{t(remindKey(remind))}</option>
          ))}
        </select>
      </label>
    </div>
  )
}
