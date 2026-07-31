<script setup lang="ts">
import { toRef, onMounted } from 'vue'
import { useScrollbar } from '@/composables/useScrollbar'

export type { ScrollbarVariant } from '@/composables/useScrollbar'
import type { ScrollbarVariant } from '@/composables/useScrollbar'

const props = withDefaults(
  defineProps<{
    variant?: ScrollbarVariant
    /** 目标滚动容器的 CSS 选择器（必填 —— 组件不再默认耦合应用布局类名） */
    target?: string
    dotColor?: string
    accentColor?: string
    sigma?: number
  }>(),
  {
    variant: 'standard',
    target: '',
    dotColor: '153,153,153',
    accentColor: '205,250,78',
    sigma: 14,
  }
)

const { start } = useScrollbar({
  variant: toRef(props, 'variant'),
  target: toRef(props, 'target'),
  dotColor: toRef(props, 'dotColor'),
  accentColor: toRef(props, 'accentColor'),
  sigma: toRef(props, 'sigma'),
})

onMounted(start)
</script>

<template>
  <span v-if="false" />
</template>
