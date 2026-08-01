import type { Meta, StoryObj } from '@storybook/vue3'
import NeumorphismTabs from './NeumorphismTabs.vue'

const meta: Meta<typeof NeumorphismTabs> = {
  title: 'Navigation/NeumorphismTabs',
  component: NeumorphismTabs,
  tags: ['autodocs'],
  argTypes: {
    position: { control: 'select', options: ['top', 'left', 'right'] },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
  },
  args: {
    tabs: [
      { key: 'overview', label: '概览' },
      { key: 'api', label: 'API' },
      { key: 'examples', label: '示例' },
      { key: 'disabled', label: '禁用', disabled: true },
    ],
    modelValue: 'overview',
    position: 'top',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Top: Story = {}
export const Left: Story = { args: { position: 'left' } }
export const Right: Story = { args: { position: 'right' } }
export const Small: Story = { args: { size: 'small' } }
export const Large: Story = { args: { size: 'large' } }
