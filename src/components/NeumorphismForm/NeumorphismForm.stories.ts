import type { Meta, StoryObj } from '@storybook/vue3'
import { reactive, ref } from 'vue'
import NeumorphismForm from '../NeumorphismForm/NeumorphismForm.vue'
import NeumorphismFormItem from '../NeumorphismForm/NeumorphismFormItem.vue'
import NeumorphismInput from '../NeumorphismInput/NeumorphismInput.vue'
import NeumorphismSelect from '../NeumorphismSelect/NeumorphismSelect.vue'
import NeumorphismButton from '../NeumorphismButton/NeumorphismButton.vue'

const meta: Meta<typeof NeumorphismForm> = {
  title: 'Form/NeumorphismForm',
  component: NeumorphismForm,
  tags: ['autodocs'],
  argTypes: {
    direction: { control: 'select', options: ['vertical', 'horizontal'] },
  },
  args: { direction: 'vertical' },
}

export default meta
type Story = StoryObj<typeof meta>

const renderForm = (args: Record<string, unknown>) => ({
  components: {
    NeumorphismForm,
    NeumorphismFormItem,
    NeumorphismInput,
    NeumorphismSelect,
    NeumorphismButton,
  },
  setup() {
    const model = reactive({ name: '', framework: '' })
    const rules = {
      name: [{ required: true, message: '请输入名称', min: 2 }],
    }
    const options = [
      { label: 'Vue 3', value: 'vue' },
      { label: 'React 18', value: 'react' },
    ]
    const submitted = ref('')
    function onSubmit() {
      submitted.value = JSON.stringify(model)
    }
    return { args, model, rules, options, submitted, onSubmit }
  },
  template: `
    <div style="width: 360px">
      <NeumorphismForm v-bind="args" :model="model" :rules="rules" @submit="onSubmit">
        <NeumorphismFormItem label="名称" name="name" required>
          <NeumorphismInput v-model="model.name" placeholder="至少 2 个字符" />
        </NeumorphismFormItem>
        <NeumorphismFormItem label="框架" name="framework">
          <NeumorphismSelect v-model="model.framework" :options="options" placeholder="请选择" />
        </NeumorphismFormItem>
        <NeumorphismButton type="submit">提交</NeumorphismButton>
      </NeumorphismForm>
      <p v-if="submitted" style="margin-top: 8px; font-size: 12px; color: var(--nm-text-secondary)">
        {{ submitted }}
      </p>
    </div>
  `,
})

export const Default: Story = { render: renderForm }
export const Horizontal: Story = { render: renderForm, args: { direction: 'horizontal' } }
