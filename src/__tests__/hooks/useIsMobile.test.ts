// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useIsMobile } from '../../hooks/useIsMobile'

type ChangeListener = (e: { matches: boolean }) => void

function mockMatchMedia(initialMatches: boolean) {
  const listeners: ChangeListener[] = []

  const mql = {
    matches: initialMatches,
    media: '',
    onchange: null,
    addEventListener: vi.fn((_event: string, cb: ChangeListener) => listeners.push(cb)),
    removeEventListener: vi.fn((_event: string, cb: ChangeListener) => {
      const i = listeners.indexOf(cb)
      if (i >= 0) listeners.splice(i, 1)
    }),
    dispatchEvent: vi.fn(),
    /** Test helper — simulate a viewport resize */
    trigger(matches: boolean) {
      mql.matches = matches
      listeners.forEach((l) => l({ matches }))
    },
  }

  Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn().mockReturnValue(mql) })
  return mql
}

describe('useIsMobile', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns true when viewport is mobile-sized', () => {
    mockMatchMedia(true)
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 })
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('returns false when viewport is desktop-sized', () => {
    mockMatchMedia(false)
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1280 })
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('updates reactively when viewport crosses the 768px breakpoint', () => {
    const mql = mockMatchMedia(false)
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1280 })
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    act(() => mql.trigger(true))
    expect(result.current).toBe(true)

    act(() => mql.trigger(false))
    expect(result.current).toBe(false)
  })

  it('registers exactly one change listener', () => {
    const mql = mockMatchMedia(false)
    renderHook(() => useIsMobile())
    expect(mql.addEventListener).toHaveBeenCalledOnce()
    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('removes the change listener on unmount', () => {
    const mql = mockMatchMedia(false)
    const { unmount } = renderHook(() => useIsMobile())
    unmount()
    expect(mql.removeEventListener).toHaveBeenCalledOnce()
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('uses the media query string for 767px max-width', () => {
    const mql = mockMatchMedia(false)
    renderHook(() => useIsMobile())
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)')
  })
})
