import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useSegmented, type SegmentedOption } from './useSegmented'

const OPTIONS: SegmentedOption[] = [
  { label: '无约束', value: 'none' },
  { label: '白名单', value: 'allowlist' },
  { label: '黑名单', value: 'denylist', disabled: true },
]

function setup(modelValue = ref<string | number | undefined>('none')) {
  const onChange = vi.fn()
  const seg = useSegmented({ modelValue, options: ref(OPTIONS), onChange })
  return { modelValue, onChange, seg }
}

function keydown(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, cancelable: true })
}

describe('useSegmented', () => {
  it('select 更新 modelValue 并触发 onChange，同步焦点索引', () => {
    const { modelValue, onChange, seg } = setup()
    seg.select(OPTIONS[1])
    expect(modelValue.value).toBe('allowlist')
    expect(onChange).toHaveBeenCalledWith('allowlist')
    expect(seg.isActive(OPTIONS[1])).toBe(true)
    expect(seg.focusIndex.value).toBe(1)
  })

  it('focusIndex 初始落在选中项（ARIA radiogroup 的 Tab 落点）', () => {
    const { seg } = setup(ref<string | number | undefined>('allowlist'))
    expect(seg.focusIndex.value).toBe(1)
    expect(seg.tabindexFor(1)).toBe(0)
    expect(seg.tabindexFor(0)).toBe(-1)
  })

  it('focusIndex 初始跳过禁用项（首项禁用时不落在其上）', () => {
    const seg = useSegmented({
      modelValue: ref<string | number | undefined>(undefined),
      options: ref([
        { label: '禁用', value: 'x', disabled: true },
        { label: '可用', value: 'y' },
      ]),
    })
    expect(seg.focusIndex.value).toBe(1)
  })

  it('options 收缩时钳制焦点索引', () => {
    const { seg } = setup(ref<string | number | undefined>('allowlist'))
    expect(seg.focusIndex.value).toBe(1)
    // 收缩到只剩一项
    const modelValue = ref<string | number | undefined>('a')
    const opts = ref([
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
      { label: 'C', value: 'c' },
    ])
    const seg2 = useSegmented({ modelValue, options: opts })
    seg2.focusIndex.value = 2
    opts.value = [{ label: 'A', value: 'a' }]
    // watch 触发后焦点回落到合法范围
    return Promise.resolve().then(() => {
      expect(seg2.focusIndex.value).toBe(0)
      expect(seg.focusIndex.value).toBe(1)
    })
  })

  it('外部赋新选中值时焦点跟随', async () => {
    const modelValue = ref<string | number | undefined>('none')
    const { seg } = setup(modelValue)
    modelValue.value = 'allowlist'
    await Promise.resolve()
    expect(seg.focusIndex.value).toBe(1)
  })

  it('禁用项不可选中', () => {
    const { modelValue, onChange, seg } = setup()
    expect(seg.isItemDisabled(OPTIONS[2])).toBe(true)
    seg.select(OPTIONS[2])
    expect(modelValue.value).toBe('none')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('整体禁用时任一项均不可选中', () => {
    const modelValue = ref<string | number | undefined>('none')
    const seg = useSegmented({
      modelValue,
      options: ref(OPTIONS),
      disabled: ref(true),
    })
    seg.select(OPTIONS[1])
    expect(modelValue.value).toBe('none')
  })

  it('方向键导航跳过禁用项并同步选中', () => {
    const { modelValue, seg } = setup()
    const event = keydown('ArrowRight')
    seg.handleKeydown(event)
    expect(event.defaultPrevented).toBe(true)
    // 从索引 0 出发：索引 1 可选中；再按一次跳过禁用的索引 2 回到 0
    expect(seg.focusIndex.value).toBe(1)
    expect(modelValue.value).toBe('allowlist')

    seg.handleKeydown(keydown('ArrowRight'))
    expect(seg.focusIndex.value).toBe(0)
    expect(modelValue.value).toBe('none')

    seg.handleKeydown(keydown('ArrowLeft'))
    expect(seg.focusIndex.value).toBe(1)
    expect(modelValue.value).toBe('allowlist')
  })

  it('Home / End 跳到首末可用项', () => {
    const { modelValue, seg } = setup()
    seg.handleKeydown(keydown('End'))
    // 末位禁用 → 落到最后的可用项（索引 1）
    expect(seg.focusIndex.value).toBe(1)
    expect(modelValue.value).toBe('allowlist')

    seg.handleKeydown(keydown('Home'))
    expect(seg.focusIndex.value).toBe(0)
    expect(modelValue.value).toBe('none')
  })

  it('roving tabindex 仅聚焦项为 0', () => {
    const { seg } = setup()
    expect(seg.tabindexFor(0)).toBe(0)
    expect(seg.tabindexFor(1)).toBe(-1)
  })

  it('无关按键不干预默认行为', () => {
    const { modelValue, seg } = setup()
    const event = keydown('Enter')
    seg.handleKeydown(event)
    expect(event.defaultPrevented).toBe(false)
    expect(modelValue.value).toBe('none')
  })
})
