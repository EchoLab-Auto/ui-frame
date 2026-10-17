<script setup lang="ts">
/**
 * 文档树节点图标（`composites/doc` 薄封装）。
 *
 * 语义名来自 `tree-utils.getNodeIcon`（'folder' | 'api' | 'guide' | …），
 * 几何统一取自 icons 注册表（`src/icons/registry.ts`）——本组件只做
 * **文档域语义 → 注册表语义**的映射，不再自持 path 数据。
 *
 * 2026-10 前它自带一套 `ICON_PATHS`（9 条），是库内最后一处第二套图标体系。
 */
import { computed } from 'vue'
import NeumorphismIcon from '@/components/NeumorphismIcon/NeumorphismIcon.vue'
import type { IconName } from '@/icons/registry'

export interface DocTreeIconProps {
  /** 文档域语义名（`tree-utils.getNodeIcon` / `nodeToTreeData` 的返回值） */
  name?: string
  /** 显示尺寸（px；缺省 14，与库内行内图标一致） */
  size?: number
}

const props = withDefaults(
  defineProps<{
    /** 文档域语义名（`tree-utils.getNodeIcon` / `nodeToTreeData` 的返回值） */
    name?: string
    /** 显示尺寸（px；缺省 14，与库内行内图标一致） */
    size?: number
  }>(),
  { name: 'file', size: 14 }
)

/**
 * 文档域语义 → 注册表语义。
 * 目录 / 文件的语义名与注册表一致；其余按文档用途映射到通用图标
 * （`api` 用插头、`config` 用滑杆、`example` 用灯泡……）。
 */
const DOC_ICON: Record<string, IconName> = {
  folder: 'folder',
  file: 'file',
  api: 'plug',
  guide: 'guide',
  config: 'config',
  example: 'example',
  install: 'install',
  changelog: 'changelog',
  faq: 'faq',
}

const iconName = computed<IconName>(() => DOC_ICON[props.name] ?? 'file')
</script>

<template>
  <NeumorphismIcon :name="iconName" :size="props.size" />
</template>
