<script setup lang="ts">
import { computed, provide } from 'vue'

export type RowAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
export type RowJustify = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'

export interface NeumorphismRowProps {
  /** 列间距（px） */
  gutter?: number | [number, number]
  /** 水平方向子元素排列方式 */
  justify?: RowJustify
  /** 垂直方向子元素对齐方式 */
  align?: RowAlign
  /** 是否换行 */
  wrap?: boolean
}

const props = withDefaults(defineProps<NeumorphismRowProps>(), {
  gutter: 0,
  justify: 'start',
  align: 'stretch',
  wrap: true,
})

const gutterX = computed(() => Array.isArray(props.gutter) ? props.gutter[0] : props.gutter)
const gutterY = computed(() => Array.isArray(props.gutter) ? props.gutter[1] : props.gutter)

provide('nm-row-gutter', { x: gutterX, y: gutterY })

const justifyMap: Record<RowJustify, string> = {
  'start': 'flex-start',
  'center': 'center',
  'end': 'flex-end',
  'space-between': 'space-between',
  'space-around': 'space-around',
  'space-evenly': 'space-evenly',
}

const alignMap: Record<RowAlign, string> = {
  'start': 'flex-start',
  'center': 'center',
  'end': 'flex-end',
  'stretch': 'stretch',
  'baseline': 'baseline',
}

const style = computed(() => {
  const gx = gutterX.value
  const gy = gutterY.value
  if (gx === 0 && gy === 0) return undefined
  return {
    marginLeft: gx ? `${-gx / 2}px` : undefined,
    marginRight: gx ? `${-gx / 2}px` : undefined,
    rowGap: gy ? `${gy}px` : undefined,
  }
})

const classList = computed(() => [
  'nm-row',
  `nm-row--justify-${props.justify}`,
  `nm-row--align-${props.align}`,
  { 'nm-row--nowrap': !props.wrap },
])
</script>

<template>
  <div :class="classList" :style="[style, { justifyContent: justifyMap[justify], alignItems: alignMap[align] }]">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.nm-row {
  display: flex;
  flex-wrap: wrap;
  box-sizing: border-box;

  &--nowrap {
    flex-wrap: nowrap;
  }
}
</style>
