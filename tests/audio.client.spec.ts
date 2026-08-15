/** Completion-sound player: injected element factory, autoplay queuing, and replacement semantics. */
import { describe, expect, it, vi } from 'vitest'
import { createNotifyPlayer, type NotifyPlayerDeps } from '../src/client/audio.ts'

function fakeAudio(rejectName?: string) {
  const el = {
    src: '',
    volume: 1,
    pause: vi.fn(),
    play: vi.fn(() => rejectName === undefined
      ? Promise.resolve()
      : Promise.reject(new DOMException('play blocked', rejectName))),
  }
  return el
}

function makePlayer(rejectName?: string) {
  const elements: Array<ReturnType<typeof fakeAudio>> = []
  const deps: NotifyPlayerDeps = {
    audio: () => {
      const el = fakeAudio(rejectName)
      elements.push(el)
      return el as unknown as HTMLAudioElement
    },
  }
  return { player: createNotifyPlayer(deps), elements }
}

describe('createNotifyPlayer', () => {
  it('plays through the injected factory with the MP3 data URL and volume', () => {
    const { player, elements } = makePlayer()
    player.play('a', 0.4)
    expect(elements).toHaveLength(1)
    expect(elements[0]?.src).toMatch(/^data:audio\/mpeg;base64,/)
    expect(elements[0]?.volume).toBe(0.4)
    expect(elements[0]?.play).toHaveBeenCalledTimes(1)
  })

  it('replaces the in-flight element so completions never stack', () => {
    const { player, elements } = makePlayer()
    player.play('a', 0.4)
    player.play('b', 0.8)
    expect(elements).toHaveLength(2)
    expect(elements[0]?.pause).toHaveBeenCalledTimes(1)
    expect(elements[1]?.src).toMatch(/^data:audio\/mpeg;base64,/)
    expect(elements[1]?.volume).toBe(0.8)
  })

  it('queues an autoplay denial and flushes it on unlock', async () => {
    const { player, elements } = makePlayer('NotAllowedError')
    player.play('a', 0.5)
    expect(elements).toHaveLength(1)
    expect(elements[0]?.play).toHaveBeenCalledTimes(1)
    // The rejection is queued on the play() promise's microtask; let it land.
    await Promise.resolve()
    player.unlock()
    expect(elements).toHaveLength(2)
    expect(elements[1]?.play).toHaveBeenCalledTimes(1)
    await expect(elements[1]?.play.mock.results[0]?.value).rejects.toMatchObject({ name: 'NotAllowedError' })
  })

  it('does not queue a non-autoplay rejection', async () => {
    const { player, elements } = makePlayer('AbortError')
    player.play('a', 0.5)
    expect(elements).toHaveLength(1)
    await Promise.resolve()
    player.unlock()
    expect(elements).toHaveLength(1)
  })

  it('a play while queued keeps only the latest request', async () => {
    const { player, elements } = makePlayer('NotAllowedError')
    player.play('a', 0.5)
    // Let the first rejection populate the queue before the second play.
    await Promise.resolve()
    player.play('b', 0.9)
    expect(elements).toHaveLength(1)
    player.unlock()
    expect(elements).toHaveLength(2)
    expect(elements[1]?.volume).toBe(0.9)
  })
})
