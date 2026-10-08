<script setup lang="ts">
/**
 * 文档树节点图标渲染组件。
 *
 * 消费 tree-utils 的语义图标名（'folder' | 'api' | 'guide' | ...），
 * 渲染为与库图标体系一致的线框 SVG（见 design-philosophy 第八节：
 * 24 viewBox / currentColor / 线宽 2；显示尺寸由父级 CSS 控制，默认 14px）。
 */
import { computed } from 'vue'

export interface DocTreeIconProps {
  /** 语义图标名（tree-utils.getNodeIcon 的返回值） */
  name?: string
  /** 显示尺寸（px） */
  size?: number
}

const props = withDefaults(
  defineProps<{
    /** 语义图标名（tree-utils.getNodeIcon 的返回值） */
    name?: string
    /** 显示尺寸（px） */
    size?: number
  }>(),
  { name: 'file', size: 14 }
)

/** 语义名 → path 数据（24 viewBox） */
const ICON_PATHS: Record<string, string[]> = {
  folder: ['M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'],
  api: ['M12 22v-5', 'M9 8V2', 'M15 8V2', 'M18 8v3a6 6 0 0 1-12 0V8z'],
  guide: ['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'],
  config: ['M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6'],
  example: [
    'M9 18h6',
    'M10 22h4',
    'M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z',
  ],
  install: [
    'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
    'M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12',
  ],
  changelog: [
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    'M14 2v6h6',
    'M16 13H8M16 17H8',
  ],
  faq: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3',
    'M12 17h.01',
  ],
  file: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6'],
}

const paths = computed(() => ICON_PATHS[props.name] ?? ICON_PATHS.file)
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="(d, i) in paths" :key="i" :d="d" />
  </svg>
</template>
