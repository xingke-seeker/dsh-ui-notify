// @vitest-environment jsdom
/** Notifications row: control wiring and write routing — driven purely through props. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NotifyRow, type NotifyRowComponentProps, type NotifyRowInjected } from '../src/client/NotifyRow.tsx'
import type { NotifyRowState } from '../src/client/settings-store.ts'
import { zh } from '../src/client/locales.ts'
import type { NotifySettings } from '../src/notify-settings.ts'

/** Local translate stub: namespace dictionary lookup, no template interpolation needed here. */
const t = ((key: string) => zh[key as keyof typeof zh] ?? key) as NotifyRowComponentProps['t']

function readySettings(over: Partial<NotifySettings> = {}): NotifySettings {
  return { enabled: true, sound: 'a', volume: 0.5, remind: 'background-only', minTurnMs: 0, ...over }
}

function makeProps(settings: NotifySettings, over: Partial<NotifyRowInjected> = {}) {
  const injected: NotifyRowInjected = {
    setEnabled: vi.fn(),
    setSound: vi.fn(),
    setVolume: vi.fn(),
    setRemind: vi.fn(),
    preview: vi.fn(),
    ...over,
  }
  const state: NotifyRowState = { settings }
  const props = {
    t,
    useStore: ((selector: (state: NotifyRowState) => unknown) => selector(state)) as never,
    ...injected,
  } as unknown as NotifyRowComponentProps
  return { props, injected }
}

afterEach(cleanup)

describe('NotifyRow', () => {
  it('renders the title and controls immediately', () => {
    render(<NotifyRow {...makeProps(readySettings()).props} />)
    expect(screen.getByText('提示音提醒')).toBeTruthy()
    expect(screen.getByRole('checkbox')).toBeTruthy()
  })

  it('routes every control write through the injected face', () => {
    const { props, injected } = makeProps(readySettings())
    render(<NotifyRow {...props} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(injected.setEnabled).toHaveBeenCalledWith(false)
    fireEvent.change(screen.getByDisplayValue('提示音 1'), { target: { value: 'b' } })
    expect(injected.setSound).toHaveBeenCalledWith('b')
    fireEvent.change(screen.getByRole('slider'), { target: { value: '0.8' } })
    expect(injected.setVolume).toHaveBeenCalledWith(0.8)
    fireEvent.change(screen.getByDisplayValue('仅后台会话完成时'), { target: { value: 'any' } })
    expect(injected.setRemind).toHaveBeenCalledWith('any')
    fireEvent.click(screen.getByRole('button', { name: '试听' }))
    expect(injected.preview).toHaveBeenCalledTimes(1)
  })

  it('disables the preview while the selected sound is none', () => {
    const { props, injected } = makeProps(readySettings({ sound: 'none' }))
    render(<NotifyRow {...props} />)
    expect(screen.getByRole('button', { name: '试听' }).getAttribute('disabled')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '试听' }))
    expect(injected.preview).not.toHaveBeenCalled()
  })

  it('shows the volume as a percentage', () => {
    const { props } = makeProps(readySettings({ volume: 0.3 }))
    render(<NotifyRow {...props} />)
    expect(screen.getByText('30%')).toBeTruthy()
  })
})
