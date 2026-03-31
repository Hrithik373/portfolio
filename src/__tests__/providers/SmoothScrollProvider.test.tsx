// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// ── Hoist mocks so they're available when vi.mock factories run ───────────────
const { mockLenisInst, mockUseIsMobile } = vi.hoisted(() => ({
  mockLenisInst: { raf: vi.fn(), destroy: vi.fn() },
  mockUseIsMobile: vi.fn<[], boolean>(),
}))

vi.mock('@studio-freight/lenis', () => ({
  default: vi.fn(() => mockLenisInst),
}))

vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: mockUseIsMobile,
}))

// Import after mocks are registered
import { SmoothScrollProvider } from '../../providers/SmoothScrollProvider'
import Lenis from '@studio-freight/lenis'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SmoothScrollProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children', () => {
    mockUseIsMobile.mockReturnValue(false)
    render(
      <SmoothScrollProvider>
        <p>hello world</p>
      </SmoothScrollProvider>,
    )
    expect(screen.getByText('hello world')).toBeInTheDocument()
  })

  it('initialises Lenis on desktop (isMobile=false)', () => {
    mockUseIsMobile.mockReturnValue(false)
    render(
      <SmoothScrollProvider>
        <div />
      </SmoothScrollProvider>,
    )
    expect(vi.mocked(Lenis)).toHaveBeenCalledOnce()
    expect(vi.mocked(Lenis)).toHaveBeenCalledWith({
      lerp: 0.12,
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.5,
    })
  })

  it('does NOT initialise Lenis on mobile (isMobile=true)', () => {
    mockUseIsMobile.mockReturnValue(true)
    render(
      <SmoothScrollProvider>
        <div />
      </SmoothScrollProvider>,
    )
    expect(vi.mocked(Lenis)).not.toHaveBeenCalled()
  })

  it('destroys Lenis on unmount', () => {
    mockUseIsMobile.mockReturnValue(false)
    const { unmount } = render(
      <SmoothScrollProvider>
        <div />
      </SmoothScrollProvider>,
    )
    unmount()
    expect(mockLenisInst.destroy).toHaveBeenCalledOnce()
  })

  it('does not crash when unmounted on mobile (no Lenis to destroy)', () => {
    mockUseIsMobile.mockReturnValue(true)
    const { unmount } = render(
      <SmoothScrollProvider>
        <div />
      </SmoothScrollProvider>,
    )
    expect(() => unmount()).not.toThrow()
    expect(mockLenisInst.destroy).not.toHaveBeenCalled()
  })
})
