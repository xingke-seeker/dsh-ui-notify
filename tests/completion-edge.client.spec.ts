/** Completion-edge fold: first-observation seeding, ringing filters, and bookkeeping cleanup. */
import { describe, expect, it } from 'vitest'
import type { SessionId, SessionSummary } from '@deepseek-ai/dsh-client-runtime/client'
import { collectCompletionEdges } from '../src/client/completion-edge.ts'

const sid = (k: string): SessionId => k as SessionId

function row(id: string, running: boolean, completed?: boolean): SessionSummary {
  return {
    id: sid(id),
    displayTitle: id,
    running,
    blank: false,
    updatedAt: 0,
    ...(completed === undefined ? {} : { completed }),
  }
}

const BASE = { now: 10_000, minTurnMs: 0, remind: 'background-only' } as const

describe('collectCompletionEdges', () => {
  it('first observation records the running bit and start time without ringing', () => {
    const result = collectCompletionEdges(new Map(), new Map(), [row('s1', true)], BASE)
    expect(result.edges).toEqual([])
    expect(result.nextRunning.get('s1')).toBe(true)
    expect(result.nextSince.get('s1')).toBe(10_000)
  })

  it('first observation of an idle session records nothing to ring later', () => {
    const result = collectCompletionEdges(new Map(), new Map(), [row('s1', false)], BASE)
    expect(result.edges).toEqual([])
    expect(result.nextRunning.get('s1')).toBe(false)
    expect(result.nextSince.has('s1')).toBe(false)
  })

  it('rings a running→idle edge the Host marks completed', () => {
    const result = collectCompletionEdges(
      new Map([['s1', true]]), new Map([['s1', 1_000]]), [row('s1', false, true)], BASE,
    )
    expect(result.edges).toEqual([{ sessionId: 's1', durationMs: 9_000 }])
    expect(result.nextRunning.get('s1')).toBe(false)
    expect(result.nextSince.has('s1')).toBe(false)
  })

  it('background-only skips a completion the Host did not mark (selected session)', () => {
    const result = collectCompletionEdges(
      new Map([['s1', true]]), new Map([['s1', 1_000]]), [row('s1', false)], BASE,
    )
    expect(result.edges).toEqual([])
  })

  it('any rings every running→idle edge regardless of the completed mark', () => {
    const result = collectCompletionEdges(
      new Map([['s1', true]]), new Map([['s1', 1_000]]), [row('s1', false)],
      { ...BASE, remind: 'any' },
    )
    expect(result.edges).toEqual([{ sessionId: 's1', durationMs: 9_000 }])
  })

  it('minTurnMs filters short turns and admits exact-length turns', () => {
    const short = collectCompletionEdges(
      new Map([['s1', true]]), new Map([['s1', 9_900]]), [row('s1', false, true)],
      { ...BASE, minTurnMs: 200 },
    )
    expect(short.edges).toEqual([])
    const exact = collectCompletionEdges(
      new Map([['s1', true]]), new Map([['s1', 9_800]]), [row('s1', false, true)],
      { ...BASE, minTurnMs: 200 },
    )
    expect(exact.edges).toEqual([{ sessionId: 's1', durationMs: 200 }])
  })

  it('idle→running records the start time without ringing', () => {
    const result = collectCompletionEdges(
      new Map([['s1', false]]), new Map(), [row('s1', true)], BASE,
    )
    expect(result.edges).toEqual([])
    expect(result.nextSince.get('s1')).toBe(10_000)
  })

  it('running→running is not an edge', () => {
    const result = collectCompletionEdges(
      new Map([['s1', true]]), new Map([['s1', 1_000]]), [row('s1', true)], BASE,
    )
    expect(result.edges).toEqual([])
    expect(result.nextSince.get('s1')).toBe(1_000)
  })

  it('idle→idle is not an edge and keeps no start time', () => {
    const result = collectCompletionEdges(
      new Map([['s1', false]]), new Map(), [row('s1', false)], BASE,
    )
    expect(result.edges).toEqual([])
    expect(result.nextRunning.get('s1')).toBe(false)
    expect(result.nextSince.has('s1')).toBe(false)
  })

  it('drops bookkeeping for sessions removed from the list', () => {
    const result = collectCompletionEdges(
      new Map([['s1', true], ['s2', true]]),
      new Map([['s1', 1_000], ['s2', 2_000]]),
      [row('s2', true)],
      BASE,
    )
    expect(result.edges).toEqual([])
    expect([...result.nextRunning.keys()]).toEqual(['s2'])
    expect([...result.nextSince.keys()]).toEqual(['s2'])
  })

  it('a missing start time yields a zero-duration edge', () => {
    const result = collectCompletionEdges(
      new Map([['s1', true]]), new Map(), [row('s1', false, true)], BASE,
    )
    expect(result.edges).toEqual([{ sessionId: 's1', durationMs: 0 }])
  })
})
