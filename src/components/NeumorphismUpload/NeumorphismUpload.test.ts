import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NeumorphismUpload from './NeumorphismUpload.vue'
import { UPLOAD_SCALE } from '@/utils/controlScales'

const mockFile = {
  id: '1',
  name: 'test.pdf',
  size: 1024,
  type: 'application/pdf',
  status: 'done' as const,
  progress: 100,
}

describe('NeumorphismUpload', () => {
  it('renders upload trigger area', () => {
    const wrapper = mount(NeumorphismUpload)
    expect(wrapper.find('.nm-upload').exists()).toBe(true)
  })

  it('shows drag mode when drag prop is true', () => {
    const wrapper = mount(NeumorphismUpload, { props: { drag: true } })
    expect(wrapper.find('.nm-upload--drag').exists()).toBe(true)
  })

  it('renders file name in text mode', () => {
    const wrapper = mount(NeumorphismUpload, {
      props: { modelValue: [mockFile], listType: 'text' },
    })
    expect(wrapper.text()).toContain('test.pdf')
  })

  it('renders in picture list mode', () => {
    const wrapper = mount(NeumorphismUpload, {
      props: {
        modelValue: [{ ...mockFile, name: 'img.png', type: 'image/png' }],
        listType: 'picture',
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('shows upload prompt text', () => {
    const wrapper = mount(NeumorphismUpload)
    expect(wrapper.text()).toBeTruthy()
  })

  it('passes accept prop for file type filtering', () => {
    const wrapper = mount(NeumorphismUpload, { props: { accept: 'image/*' } })
    expect(wrapper.exists()).toBe(true)
  })

  describe('size（数字是一等公民）', () => {
    it('数字 size：走 --sized 类 + 内联 CSS 变量，不挂档位类', () => {
      // 120 落在锚点 100(md) 与 140(lg) 之间：值就是「触发区最小高度」px
      const wrapper = mount(NeumorphismUpload, { props: { size: 120 } })
      expect(wrapper.classes()).toContain('nm-upload--sized')
      expect(wrapper.classes().some(c => /^nm-upload--(small|medium|large)$/.test(c))).toBe(false)
      expect(wrapper.attributes('style')).toContain('--nm-upload-sz-trigger-height: 120px')
      // 拖拽区仍在（默认 drag=true），尺寸规则挂在它身上
      expect(wrapper.find('.nm-upload__trigger').exists()).toBe(true)
    })

    it('数字 size 在锚点上与档位别名一致（72 / 100 / 140）', () => {
      const height =
        UPLOAD_SCALE.primary /* --nm-upload-sz-trigger-height 是主几何量，已提到 primaryVar */
      // 锚点值只从引擎取一次，测试里不再抄第二份数字
      expect([height.sm, height.md, height.lg]).toEqual([72, 100, 140])
      const anchors = [
        [height.sm, 'small'],
        [height.md, 'medium'],
        [height.lg, 'large'],
      ] as const
      for (const [px, tier] of anchors) {
        const byNumber = mount(NeumorphismUpload, { props: { size: px } })
        expect(byNumber.attributes('style')).toContain(`--nm-upload-sz-trigger-height: ${px}px`)

        const byTier = mount(NeumorphismUpload, { props: { size: tier } })
        expect(byTier.classes()).toContain(`nm-upload--${tier}`)
        // 档位路径不写内联变量：两条通道互不干扰
        expect(byTier.attributes('style')).toBeUndefined()
      }
    })

    it('数字 size 容错：0 / 负数 / NaN 回落到 medium 锚点 100', () => {
      for (const bad of [0, -12, Number.NaN]) {
        const wrapper = mount(NeumorphismUpload, { props: { size: bad } })
        expect(wrapper.attributes('style')).toContain('--nm-upload-sz-trigger-height: 100px')
        // 回落后仍走数字通道，不会掉回档位类
        expect(wrapper.classes()).toContain('nm-upload--sized')
      }
    })
  })
})
