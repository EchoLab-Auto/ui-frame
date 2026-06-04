<script setup lang="ts">
import { computed, ref, watch } from 'vue'

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

watch(() => props.src, () => {
  showFallback.value = false
})

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
    <span v-else-if="icon || $slots.fallback" class="nm-avatar__fallback nm-avatar__icon">
      <slot name="fallback">
        {{ fallbackContent }}
      </slot>
    </span>
    <span v-else class="nm-avatar__fallback">{{ fallbackContent }}</span>
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
.nm-avatar--small  { width: var(--nm-avatar-size-sm); height: var(--nm-avatar-size-sm); font-size: var(--nm-avatar-font-sm); }
.nm-avatar--medium { width: var(--nm-avatar-size-md); height: var(--nm-avatar-size-md); font-size: var(--nm-avatar-font-md); }
.nm-avatar--large  { width: var(--nm-avatar-size-lg); height: var(--nm-avatar-size-lg); font-size: var(--nm-avatar-font-lg); }
</style>
