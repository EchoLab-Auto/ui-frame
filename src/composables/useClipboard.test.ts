import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useClipboard } from './useClipboard'

describe('useClipboard', () => {
  const writeText = vi.fn<(text: string) => Promise<void>>()

  beforeEach(() => {
    vi.useFakeTimers()
    writeText.mockReset()
    writeText.mockResolvedValue(undefined)
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('复制成功后 copied 为 true，并在 resetDelay 后自动复位', async () => {
    const { copied, copy } = useClipboard({ resetDelay: 1000 })

    const ok = await copy('hello')
    expect(ok).toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
    expect(copied.value).toBe(true)

    vi.advanceTimersByTime(1000)
    expect(copied.value).toBe(false)
  })

  it('重复复制会重置复位计时', async () => {
    const { copied, copy } = useClipboard({ resetDelay: 1000 })

    await copy('a')
    vi.advanceTimersByTime(600)
    await copy('b')
    vi.advanceTimersByTime(600)
    expect(copied.value).toBe(true)
    vi.advanceTimersByTime(400)
    expect(copied.value).toBe(false)
  })

  it('剪贴板不可用时返回 false 且不置 copied', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    })
    const { copied, copy } = useClipboard()
    expect(await copy('x')).toBe(false)
    expect(copied.value).toBe(false)
  })

  it('writeText  reject 时返回 false', async () => {
    writeText.mockRejectedValue(new Error('denied'))
    const { copied, copy } = useClipboard()
    expect(await copy('x')).toBe(false)
    expect(copied.value).toBe(false)
  })
})
