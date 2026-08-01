import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import NeumorphismModal from './NeumorphismModal.vue'
import NeumorphismButton from '../NeumorphismButton/NeumorphismButton.vue'

const meta: Meta<typeof NeumorphismModal> = {
  title: 'Feedback/NeumorphismModal',
  component: NeumorphismModal,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    closable: { control: 'boolean' },
    maskClosable: { control: 'boolean' },
  },
  args: {
    title: '确认操作',
    size: 'medium',
  },
}

export default meta
type Story = StoryObj<typeof meta>

const renderOpen = (args: Record<string, unknown>) => ({
  components: { NeumorphismModal, NeumorphismButton },
  setup() {
    const visible = ref(true)
    return { args, visible }
  },
  template: `
    <NeumorphismModal v-model="visible" v-bind="args">
      <p>确定要执行该操作吗？此操作不可撤销。</p>
    </NeumorphismModal>
  `,
})

export const Default: Story = { render: renderOpen }
export const Small: Story = { render: renderOpen, args: { size: 'small' } }
export const Large: Story = { render: renderOpen, args: { size: 'large' } }
export const NoClose: Story = {
  render: renderOpen,
  args: { closable: false, maskClosable: false },
}
