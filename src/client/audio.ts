/**
 * Completion-sound player: plays one embedded MP3 through HTMLAudioElement
 * with a data: URL. Autoplay policy means `play()` can reject until the page
 * has sticky user activation; the player queues such attempts and flushes
 * them on the first explicit unlock (the plugin arms unlock on the first
 * pointer/key gesture). A new play replaces the in-flight element so rapid
 * completions never stack sounds, and a not-yet-unlocked request keeps only
 * the latest selection.
 */

import { NOTIFY_AUDIO } from '../audio/audio-data.ts'

/** Sound keys selectable in settings (the embedded map minus 'none'). */
export type SelectableSound = 'a' | 'b' | 'c'

/** Player dependencies, injectable for tests. */
export interface NotifyPlayerDeps {
  /** Audio element factory; defaults to the global Audio constructor. */
  audio?: () => HTMLAudioElement
}

/** The completion-sound player face. */
export interface NotifyPlayer {
  /** Mark user activation; flush any queued play attempts. */
  unlock(): void
  /**
   * Play one sound.
   * @param sound - embedded sound key.
   * @param volume - element volume, 0..1.
   */
  play(sound: SelectableSound, volume: number): void
}

/** MP3 data URL for one embedded sound. */
function dataUrl(sound: SelectableSound): string {
  return `data:audio/mpeg;base64,${NOTIFY_AUDIO[sound]}`
}

/** Narrow a play() rejection to the autoplay denial. */
function isNotAllowed(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'NotAllowedError'
}

/**
 * Build the player.
 * @param deps - injectable dependencies.
 * @returns the player face.
 */
export function createNotifyPlayer(deps: NotifyPlayerDeps = {}): NotifyPlayer {
  const audio = deps.audio ?? (() => new Audio())
  let current: HTMLAudioElement | undefined
  const queued: Array<{ sound: SelectableSound; volume: number }> = []
  const playOne = (sound: SelectableSound, volume: number): void => {
    current?.pause()
    const el = audio()
    el.src = dataUrl(sound)
    el.volume = volume
    current = el
    void el.play().catch((error: unknown) => {
      if (isNotAllowed(error)) queued.push({ sound, volume })
    })
  }
  return {
    unlock: () => {
      const pending = queued.splice(0)
      for (const item of pending) playOne(item.sound, item.volume)
    },
    play: (sound, volume) => {
      if (queued.length > 0) {
        queued.length = 0
        queued.push({ sound, volume })
        return
      }
      playOne(sound, volume)
    },
  }
}
