<script setup lang="ts">
/**
 * 展示 + 配置台（Button 那套布局的通用版）。
 *
 * 左侧实时预览、右侧参数表单、底部实时代码片段；窄屏自动收成一列。
 * 预览台的背景可在「平面 / 彩色」间切换——玻璃、半透明、模糊这类材质
 * 只有在彩色背景上才看得出层次。
 *
 * 用法：
 * ```vue
 * <DemoPlayground v-model:stage="stage" :snippet="snippet" hint="…">
 *   <NeumorphismButton v-bind="preview" />
 *   <template #spec>variant=<b>raised</b></template>
 *   <template #config>
 *     <DemoField label="变体">…</DemoField>
 *   </template>
 * </DemoPlayground>
 * ```
 */
export type DemoStage = 'plane' | 'gradient'

withDefaults(
  defineProps<{
    /** 实时代码片段；空串则不渲染代码块 */
    snippet?: string
    /** 预览台下方的说明文字（也可用 #hint 插槽写富文本） */
    hint?: string
    /** 隐藏背景切换（组件对背景不敏感时） */
    stageSwitch?: boolean
    /** 预览区最小高度，如 `140px` */
    minHeight?: string
  }>(),
  { snippet: '', hint: '', stageSwitch: true, minHeight: '' }
)

/** 预览台背景（v-model:stage，由宿主持有以便「套用玻璃」之类的动作联动） */
const stage = defineModel<DemoStage>('stage', { default: 'plane' })

const stageOptions = [
  { label: '平面', value: 'plane' },
  { label: '彩色', value: 'gradient' },
]
</script>

<template>
  <div class="demo-playground" :class="{ 'demo-playground--solo': !$slots.config }">
    <div
      class="demo-playground__stage"
      :class="`demo-playground__stage--${stage}`"
      :style="minHeight ? { minHeight } : undefined"
    >
      <slot />

      <p v-if="$slots.spec" class="demo-playground__spec">
        <slot name="spec" />
      </p>

      <div v-if="stageSwitch" class="demo-playground__bg">
        <span class="demo-playground__bg-label">预览背景</span>
        <NeumorphismSegmented v-model="stage" :options="stageOptions" size="small" />
      </div>

      <p v-if="hint || $slots.hint" class="demo-hint demo-playground__hint">
        <slot name="hint">{{ hint }}</slot>
      </p>
    </div>

    <div v-if="$slots.config" class="demo-playground__config">
      <slot name="config" />
      <pre v-if="snippet" class="demo-playground__snippet">{{ snippet }}</pre>
    </div>
  </div>
</template>
