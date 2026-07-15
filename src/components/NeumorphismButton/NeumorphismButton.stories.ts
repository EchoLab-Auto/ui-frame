import type { Meta, StoryObj } from '@storybook/vue3'
import NeumorphismButton from './NeumorphismButton.vue'

const meta: Meta<typeof NeumorphismButton> = {
  title: 'Base/NeumorphismButton',
  component: NeumorphismButton,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['raised', 'flat', 'pressed', 'primary', 'glow'] },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    shape: { control: 'select', options: ['rounded', 'pill', 'circle'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
  args: {
    variant: 'raised',
    size: 'medium',
    shape: 'rounded',
    disabled: false,
    loading: false,
    default: 'Click Me',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Raised: Story = { args: { variant: 'raised' } }
export const Flat: Story = { args: { variant: 'flat' } }
export const Pressed: Story = { args: { variant: 'pressed' } }
export const Primary: Story = { args: { variant: 'primary' } }
export const Glow: Story = { args: { variant: 'glow' } }
export const Small: Story = { args: { size: 'small' } }
export const Large: Story = { args: { size: 'large' } }
export const Pill: Story = { args: { shape: 'pill' } }
export const Circle: Story = { args: { shape: 'circle', default: '✓' } }
export const Disabled: Story = { args: { disabled: true } }
export const Loading: Story = { args: { loading: true } }

export const AllVariants: Story = {
  render: () => ({
    components: { NeumorphismButton },
    template: `
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;padding:24px;background:#e0e0e0">
        <NeumorphismButton variant="raised">Raised</NeumorphismButton>
        <NeumorphismButton variant="flat">Flat</NeumorphismButton>
        <NeumorphismButton variant="pressed">Pressed</NeumorphismButton>
        <NeumorphismButton variant="primary">Primary</NeumorphismButton>
        <NeumorphismButton variant="glow">Glow</NeumorphismButton>
      </div>
    `,
  }),
}
