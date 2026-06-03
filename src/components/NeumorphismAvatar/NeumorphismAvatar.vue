<script setup lang="ts">
import { computed, ref } from 'vue'

export type AvatarSize = 'small' | 'medium' | 'large'

export interface NeumorphismAvatarProps {
  src?: string
  alt?: string
  size?: AvatarSize
  shape?: 'circle' | 'rounded'
  initials?: string
  icon?: string
}

const props = withDefaults(defineProps<NeumorphismAvatarProps>(), {
  size: 'medium',
  shape: 'circle',
})

const emit = defineEmits<{
  (e: 'error'): void
}>()

const hasImage = computed(() => !!props.src)
const showFallback = ref(false)

function onImageError() {
  showFallback.value = true
  emit('error')
}

const classList = computed(() => [
  'nm-avatar',
  `nm-avatar--${props.size}`,
  `nm-avatar--${props.shape}`,
])

const fallbackContent = computed(() => {
  if (props.initials) return props.initials.slice(0, 2).toUpperCase()
  return ''
})
</script>

<template>
  <div :class="classList" role="img" :aria-label="alt || initials || '头像'">
    <img
      v-if="hasImage && !showFallback"
      :src="src"
      :alt="alt || ''"
      class="nm-avatar__img"
      @error="onImageError"
    >
    <span v-else class="nm-avatar__fallback">
      <slot name="fallback">
        {{ fallbackContent }}
      </slot>
    </span>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: var(--nm-surface-color);
  @include nm-raised(2px, 5px);

  &--circle  { border-radius: 50%; }
  &--rounded { border-radius: var(--nm-border-radius-md); }
}

.nm-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nm-avatar__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-weight: 600;
  color: var(--nm-primary-color);
  background-color: var(--nm-surface-raised);
}

// Sizes
.nm-avatar--small  { width: 32px; height: 32px; font-size: 12px; }
.nm-avatar--medium { width: 44px; height: 44px; font-size: 16px; }
.nm-avatar--large  { width: 64px; height: 64px; font-size: 22px; }
</style>
