/**
 * Completion-edge detection over session-list snapshots: a pure fold from
 * (previous running bits, running-start times) and one row view to the set
 * of sessions whose turn just finished. First observation only records the
 * running bit — mirroring the Host summary semantics where sessions already
 * idle at load never ring; sessions removed from the list drop their
 * bookkeeping.
 */

import type { SessionSummary } from '@deepseek-ai/dsh-client-runtime/client'
import type { NotifyRemind } from '../notify-settings.ts'

/** One turn completion that passed the timing and scope filters. */
export interface CompletionEdge {
  /** The session whose turn ended. */
  sessionId: string
  /** Observed turn duration in ms. */
  durationMs: number
}

/** Options controlling edge collection. */
export interface EdgeOptions {
  /** Current time in ms (injected for deterministic tests). */
  now: number
  /** Turns shorter than this (ms) never ring. */
  minTurnMs: number
  /** 'background-only' rings only sessions the Host marks completed (not selected). */
  remind: NotifyRemind
}

/** Fold result: the filtered edges plus the next bookkeeping maps. */
export interface EdgeFold {
  /** Completions that passed every filter. */
  edges: CompletionEdge[]
  /** Running bit per session for the next fold. */
  nextRunning: Map<string, boolean>
  /** Running-start time per session for the next fold. */
  nextSince: Map<string, number>
}

/**
 * Fold one list snapshot into edges plus next bookkeeping.
 * @param prevRunning - running bit per session from the previous fold.
 * @param prevSince - running-start time per session from the previous fold.
 * @param rows - current session summary rows.
 * @param options - timing and scope filters.
 * @returns the fold result.
 */
export function collectCompletionEdges(
  prevRunning: ReadonlyMap<string, boolean>,
  prevSince: ReadonlyMap<string, number>,
  rows: readonly SessionSummary[],
  options: EdgeOptions,
): EdgeFold {
  const nextRunning = new Map<string, boolean>()
  const nextSince = new Map<string, number>()
  const edges: CompletionEdge[] = []
  for (const row of rows) {
    const prev = prevRunning.get(row.id)
    if (prev === undefined) {
      // First observation: record only, never ring.
      nextRunning.set(row.id, row.running)
      if (row.running) nextSince.set(row.id, options.now)
      continue
    }
    nextRunning.set(row.id, row.running)
    if (prev && !row.running) {
      const since = prevSince.get(row.id)
      const durationMs = since === undefined ? 0 : options.now - since
      if (durationMs >= options.minTurnMs
        && (options.remind === 'any' || row.completed === true)) {
        edges.push({ sessionId: row.id, durationMs })
      }
    } else if (row.running) {
      // Keep the start time across consecutive running observations; an
      // idle→running flip starts the clock now.
      nextSince.set(row.id, prevSince.get(row.id) ?? options.now)
    }
  }
  return { edges, nextRunning, nextSince }
}
