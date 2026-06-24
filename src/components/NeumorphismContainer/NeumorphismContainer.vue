<script setup lang="ts">
import { computed } from 'vue'
import { useNeumorphismSetup } from '@/extensions/createComponent'

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

const { config, resolveProp } = useNeumorphismSetup()

const resolvedMode = computed(() => resolveProp(props.mode, config.value.container?.mode, 'fixed'))

const classList = computed(() => [
  'nm-container',
  { 'nm-container--fluid': resolvedMode.value === 'fluid' },
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
  padding-inline: var(--nm-spacing-md);
  box-sizing: border-box;

  &:not(&--fluid) {
    max-width: 100%;

    @include nm-screen-sm {
      max-width: 540px;
    }
    @include nm-screen-md {
      max-width: 720px;
      padding-inline: var(--nm-spacing-lg);
    }
    @include nm-screen-lg {
      max-width: 960px;
    }
    @include nm-screen-xl {
      max-width: 1140px;
    }
    @include nm-screen-xxl {
      max-width: 1320px;
    }
  }

  &--no-padding {
    padding-inline: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
