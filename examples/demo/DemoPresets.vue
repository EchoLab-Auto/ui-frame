<script setup lang="ts">
/**
 * 变体一览：可点击的预设矩阵（Button 卡片底部那排格子）。
 *
 * 每格 = 真实渲染的组件 + 对应代码，点击把该格「载入」到上方配置台。
 * 视觉内容由默认插槽提供（`#default="{ item }"`），所以同一个矩阵
 * 既能放按钮，也能放开关、标签、进度条……
 */
export interface DemoPreset {
  /** 稳定键，点击时回传 */
  key: string
  /** 格子下方的代码标注 */
  code: string
  /** 是否处于选中态（由宿主比对当前配置得出） */
  active?: boolean
}

defineProps<{
  items: DemoPreset[]
}>()

defineEmits<{
  pick: [key: string]
}>()
</script>

<template>
  <div class="demo-presets">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="demo-presets__cell"
      :class="{ 'demo-presets__cell--active': item.active }"
      :aria-pressed="!!item.active"
      @click="$emit('pick', item.key)"
    >
      <slot :item="item" />
      <code class="demo-presets__code">{{ item.code }}</code>
    </button>
  </div>
</template>
