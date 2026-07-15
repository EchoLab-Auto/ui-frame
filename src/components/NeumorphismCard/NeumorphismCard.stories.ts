import type { Meta, StoryObj } from '@storybook/vue3'
import NeumorphismCard from './NeumorphismCard.vue'

const meta: Meta<typeof NeumorphismCard> = {
  title: 'Data/NeumorphismCard',
  component: NeumorphismCard,
  tags: ['autodocs'],
  argTypes: {
    elevation: { control: { type: 'range', min: -4, max: 4, step: 1 } },
    radius: { control: 'select', options: ['small', 'medium', 'large', 'xl'] },
    hoverable: { control: 'select', options: [false, true, 'bulge', 'sink'] },
    glass: { control: 'boolean' },
    noPadding: { control: 'boolean' },
  },
  args: { elevation: 2, radius: 'large', hoverable: false, glass: false, noPadding: false },
}

export default meta
type Story = StoryObj<typeof meta>

export const Raised2: Story = {
  args: { elevation: 2, default: 'Card content with elevation 2' },
}
export const Pressed: Story = {
  args: { elevation: -2, default: 'Pressed card content' },
  parameters: { backgrounds: { default: 'neumorphism-light' } },
}
export const Flush: Story = {
  args: { elevation: 0, default: 'Flush with background' },
}
export const HoverBulge: Story = {
  args: { elevation: 2, hoverable: 'bulge', default: 'Hover me — I bulge!' },
}
export const HoverSink: Story = {
  args: { elevation: -2, hoverable: 'sink', default: 'Hover me — I sink!' },
}
export const Glass: Story = {
  args: { glass: true, default: 'Frosted glass card' },
}
export const WithHeaderFooter: Story = {
  render: () => ({
    components: { NeumorphismCard },
    template: `
      <div style="padding:24px;background:#e0e0e0">
        <NeumorphismCard :elevation="2">
          <template #header><strong>Card Title</strong></template>
          <p>Card body content goes here.</p>
          <template #footer><em>Card footer</em></template>
        </NeumorphismCard>
      </div>
    `,
  }),
}
