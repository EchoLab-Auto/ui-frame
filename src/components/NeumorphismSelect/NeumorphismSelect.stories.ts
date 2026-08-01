import type { Meta, StoryObj } from '@storybook/vue3'
import NeumorphismSelect from './NeumorphismSelect.vue'

const options = [
  { label: 'Vue 3', value: 'vue' },
  { label: 'React 18', value: 'react' },
  { label: 'Angular 16', value: 'angular' },
  { label: 'Svelte 4（已禁用）', value: 'svelte', disabled: true },
  { label: 'Solid.js', value: 'solid' },
]

const meta: Meta<typeof NeumorphismSelect> = {
  title: 'Form/NeumorphismSelect',
  component: NeumorphismSelect,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'outlined'] },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    multiple: { control: 'boolean' },
    filterable: { control: 'boolean' },
    clearable: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    options,
    placeholder: '请选择框架',
    variant: 'default',
    clearable: true,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Outlined: Story = {
  args: { variant: 'outlined' },
}

export const Multiple: Story = {
  args: { multiple: true, modelValue: ['vue'] },
}

export const CollapseTags: Story = {
  args: {
    multiple: true,
    collapseTags: true,
    maxCollapseTags: 2,
    modelValue: ['vue', 'react', 'angular'],
  },
}

export const Filterable: Story = {
  args: { filterable: true },
}

export const Grouped: Story = {
  args: {
    options: [
      { label: 'Vue 3', value: 'vue', group: '渐进式框架' },
      { label: 'Nuxt', value: 'nuxt', group: '渐进式框架' },
      { label: 'Svelte 4', value: 'svelte', group: '编译时框架' },
      { label: 'Solid.js', value: 'solid', group: '编译时框架' },
    ],
  },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const Small: Story = {
  args: { size: 'small' },
}

export const Large: Story = {
  args: { size: 'large' },
}
