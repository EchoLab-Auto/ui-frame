// @vitest-environment jsdom
import { describe, it } from 'vitest'
import { mountAndCheckA11y, expectNoViolations } from './a11y-helper'
import NeumorphismButton from '@/components/NeumorphismButton/NeumorphismButton.vue'
import NeumorphismInput from '@/components/NeumorphismInput/NeumorphismInput.vue'
import NeumorphismSwitch from '@/components/NeumorphismSwitch/NeumorphismSwitch.vue'
import NeumorphismCheckbox from '@/components/NeumorphismCheckbox/NeumorphismCheckbox.vue'
import NeumorphismSelect from '@/components/NeumorphismSelect/NeumorphismSelect.vue'
import NeumorphismSlider from '@/components/NeumorphismSlider/NeumorphismSlider.vue'
import NeumorphismTabs from '@/components/NeumorphismTabs/NeumorphismTabs.vue'
import NeumorphismModal from '@/components/NeumorphismModal/NeumorphismModal.vue'

describe('a11y 自动化回归（axe-core）', () => {
  it('Button 无违规', async () => {
    expectNoViolations(await mountAndCheckA11y(NeumorphismButton, { slots: { default: '确定' } }))
  })

  it('Input（含 label 关联）无违规', async () => {
    expectNoViolations(
      await mountAndCheckA11y(NeumorphismInput, {
        props: { label: '用户名', placeholder: '请输入' },
      })
    )
  })

  it('Switch（role=switch + 可访问名称）无违规', async () => {
    expectNoViolations(await mountAndCheckA11y(NeumorphismSwitch, { props: { modelValue: true } }))
  })

  it('Checkbox 无违规', async () => {
    expectNoViolations(await mountAndCheckA11y(NeumorphismCheckbox, { props: { label: '记住我' } }))
  })

  it('Select（combobox 语义）无违规', async () => {
    expectNoViolations(
      await mountAndCheckA11y(NeumorphismSelect, {
        props: {
          options: [
            { label: 'Vue', value: 'vue' },
            { label: 'React', value: 'react' },
          ],
          placeholder: '请选择',
        },
      })
    )
  })

  it('Slider（role=slider + 值语义）无违规', async () => {
    expectNoViolations(await mountAndCheckA11y(NeumorphismSlider, { props: { modelValue: 40 } }))
  })

  it('Tabs（tablist 结构）无违规', async () => {
    expectNoViolations(
      await mountAndCheckA11y(NeumorphismTabs, {
        props: {
          tabs: [
            { key: 'a', label: '标签 A' },
            { key: 'b', label: '标签 B' },
          ],
        },
      })
    )
  })

  it('Modal（dialog 语义）无违规', async () => {
    expectNoViolations(
      await mountAndCheckA11y(NeumorphismModal, {
        props: { modelValue: true, title: '确认操作' },
        slots: { default: '<p>确定要执行该操作吗？</p>' },
      })
    )
  })
})
