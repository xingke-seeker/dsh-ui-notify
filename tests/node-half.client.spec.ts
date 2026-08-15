/** Host half: an inert loader seat with no host-side behavior. */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { apply } from '../src/index.ts'

describe('dsh-ui-notify node half', () => {
  it('is an inert loader seat', () => {
    expect(() => { apply(new Context()) }).not.toThrow()
  })
})
