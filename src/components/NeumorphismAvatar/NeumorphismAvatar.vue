<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { AVATAR_SCALE } from '@/utils/controlScales'

export type AvatarSize = 'small' | 'medium' | 'large'

export interface NeumorphismAvatarProps {
  src?: string
  alt?: string
  /**
   * 尺寸——px 直径（数字，主几何量），或三档预设名。
   *
   * 数字即「直径」：字号按三锚点（32 / 44 / 64）分段线性插值，
   * 所以 `:size="44"` 与 `size="medium"` 逐像素相同。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留，
   * 新代码请传数字。
   */
  size?: number | AvatarSize
  shape?: 'circle' | 'rounded'
  initials?: string
  icon?: string
}

const props = withDefaults(defineProps<NeumorphismAvatarProps>(), {})

const { config, resolveProp } = useNeumorphismSetup()

/** 数字尺寸的语义是「直径」，默认值取 medium 锚点 */
const DEFAULT_SIZE_PX = 44

/** 原始 size：显式 prop > 全局配置 > medium（两个通道共用同一条级联） */
const rawSize = computed(() =>
  resolveProp(props.size, config.value.avatar?.size, 'medium' as const)
)

/** 数字通道：`undefined` = 走档位 class，有值 = 走内联 CSS 变量 */
const numericSize = computed(() =>
  typeof rawSize.value === 'number'
    ? normalizeNumericSize(rawSize.value, DEFAULT_SIZE_PX)
    : undefined
)

/** 档位通道：字符串别名（数字路径下取 medium 占位，实际不挂档位类） */
const resolvedSize = computed<AvatarSize>(() =>
  typeof rawSize.value === 'string' ? rawSize.value : 'medium'
)

/** 数字尺寸下发的 CSS 变量（见 utils/controlScale） */
const sizeStyle = computed(() =>
  numericSize.value === undefined ? undefined : resolveControlScale(AVATAR_SCALE, numericSize.value)
)

const resolvedShape = computed(() => resolveProp(props.shape, config.value.avatar?.shape, 'circle'))

const emit = defineEmits<{
  (e: 'error'): void
}>()

const { t } = useLocale()

const hasImage = computed(() => !!props.src)
const showFallback = ref(false)

watch(
  () => props.src,
  () => {
    showFallback.value = false
  }
)

function onImageError() {
  showFallback.value = true
  emit('error')
}

const classList = computed(() => [
  'nm-avatar',
  // 数字与档位互斥：数字走 `--sized`（变量来自内联样式），字符串走档位类
  numericSize.value === undefined ? `nm-avatar--${resolvedSize.value}` : 'nm-avatar--sized',
  `nm-avatar--${resolvedShape.value}`,
])

const fallbackContent = computed(() => {
  if (props.initials) return props.initials.slice(0, 2).toUpperCase()
  if (props.alt) return props.alt.slice(0, 1).toUpperCase()
  return '?' // Show a question mark as a generic fallback
})
</script>

<template>
  <div
    :class="classList"
    :style="sizeStyle"
    role="img"
    :aria-label="alt || initials || t('badgeAvatar')"
  >
    <img
      v-if="hasImage && !showFallback"
      :src="src"
      :alt="alt || ''"
      class="nm-avatar__img"
      @error="onImageError"
    />
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
  transition:
    box-shadow 0.35s $nm-ease-spring,
    transform 0.35s $nm-ease-spring;

  &--circle {
    border-radius: var(--nm-border-radius-full);
  }
  &--rounded {
    border-radius: var(--nm-border-radius-md);
  }

  @media (hover: hover) {
    &:hover {
      transform: scale(1.06);
      box-shadow:
        4px 4px 10px var(--nm-shadow-dark),
        -4px -4px 10px var(--nm-shadow-light);
    }
  }

  &:active {
    transform: scale(0.96);
    transition: transform 0.1s $nm-ease-compress;
  }
}

.nm-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  animation: nm-avatar-fade-in 0.4s $nm-ease-ambient forwards;
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
.nm-avatar--small {
  width: var(--nm-avatar-size-sm);
  height: var(--nm-avatar-size-sm);
  font-size: var(--nm-avatar-font-sm);
}
.nm-avatar--medium {
  width: var(--nm-avatar-size-md);
  height: var(--nm-avatar-size-md);
  font-size: var(--nm-avatar-font-md);
}
.nm-avatar--large {
  width: var(--nm-avatar-size-lg);
  height: var(--nm-avatar-size-lg);
  font-size: var(--nm-avatar-font-lg);
}

// 数字尺寸（`:size="44"`）：宽高与字号一起由内联 CSS 变量决定，见 utils/controlScale。
// 三档 class 不作改动——数字路径不挂档位类，两者互斥、无覆盖之争。
.nm-avatar--sized {
  width: var(--nm-avatar-sz-size);
  height: var(--nm-avatar-sz-size);
  font-size: var(--nm-avatar-sz-font);
}

@keyframes nm-avatar-fade-in {
  from {
    opacity: 0;
    transform: scale(1.05);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-avatar {
    transition: none;
  }
  .nm-avatar__img {
    animation: none;
    opacity: 1;
  }
}
</style>
