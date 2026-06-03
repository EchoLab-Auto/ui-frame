<script setup lang="ts">
import { computed } from 'vue'

export interface NeumorphismContainerProps {
  /** 宽度模式：fixed 固定断点宽度，fluid 全宽 */
  mode?: 'fixed' | 'fluid'
  /** 是否移除内边距 */
  noPadding?: boolean
  /** 自定义标签 */
  tag?: string
}

const props = withDefaults(defineProps<NeumorphismContainerProps>(), {
  mode: 'fixed',
  noPadding: false,
  tag: 'div',
})

const classList = computed(() => [
  'nm-container',
  { 'nm-container--fluid': props.mode === 'fluid' },
  { 'nm-container--no-padding': props.noPadding },
])
</script>

<template>
  <component :is="tag" :class="classList">
    <slot />
  </component>
</template>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.nm-container {
  width: 100%;
  margin-inline: auto;
  padding-inline: 16px;
  box-sizing: border-box;

  &:not(&--fluid) {
    max-width: 100%;

    @include nm-screen-sm { max-width: 540px; }
    @include nm-screen-md { max-width: 720px; padding-inline: 24px; }
    @include nm-screen-lg { max-width: 960px; }
    @include nm-screen-xl { max-width: 1140px; }
    @include nm-screen-xxl { max-width: 1320px; }
  }

  &--no-padding {
    padding-inline: 0;
  }
}
</style>
