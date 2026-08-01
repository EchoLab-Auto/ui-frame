import type { Meta, StoryObj } from '@storybook/vue3'
import NeumorphismSlider from './NeumorphismSlider.vue'

const meta: Meta<typeof NeumorphismSlider> = {
  title: 'Form/NeumorphismSlider',
  component: NeumorphismSlider,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    vertical: { control: 'boolean' },
    showTooltip: { control: 'boolean' },
    showStops: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    modelValue: 40,
    min: 0,
    max: 100,
    showTooltip: true,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithStops: Story = { args: { showStops: true, step: 10 } }
export const Small: Story = { args: { size: 'small' } }
export const Large: Story = { args: { size: 'large' } }
export const Disabled: Story = { args: { disabled: true } }
export const Vertical: Story = {
  args: { vertical: true },
  parameters: { layout: 'centered' },
}
