<script setup lang="ts">
import { computed } from 'vue'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { normalizeNumericSize, resolveControlScale } from '@/utils/controlScale'
import { EMPTY_SCALE } from '@/utils/controlScales'

export type EmptySize = 'small' | 'medium' | 'large'

export interface NeumorphismEmptyProps {
  image?: string
  description?: string
  /**
   * 尺寸——px 插图边长（数字，主几何量），或三档预设名。
   *
   * 数字即「插图边长」：描述字号按三锚点（60 / 100 / 140）分段线性插值，
   * 所以 `:size="100"` 与 `size="medium"` 逐像素相同。
   *
   * @deprecated 字符串档位（`'small' | 'medium' | 'large'`）仅作兼容别名保留，
   * 新代码请传数字。
   */
  size?: number | EmptySize
}

const props = withDefaults(defineProps<NeumorphismEmptyProps>(), {})

const { config, resolveProp } = useNeumorphismSetup()

/** 数字尺寸的语义是「插图边长」，默认值取 medium 锚点 */
const DEFAULT_SIZE_PX = 100

/** 原始 size：显式 prop > 全局配置 > medium（两个通道共用同一条级联） */
const rawSize = computed(() => resolveProp(props.size, config.value.empty?.size, 'medium' as const))

/** 数字通道：`undefined` = 走档位 class，有值 = 走内联 CSS 变量 */
const numericSize = computed(() =>
  typeof rawSize.value === 'number'
    ? normalizeNumericSize(rawSize.value, DEFAULT_SIZE_PX)
    : undefined
)

/** 档位通道：字符串别名（数字路径下取 medium 占位，实际不挂档位类） */
const resolvedSize = computed<EmptySize>(() =>
  typeof rawSize.value === 'string' ? rawSize.value : 'medium'
)

/** 数字尺寸下发的 CSS 变量（见 utils/controlScale） */
const sizeStyle = computed(() =>
  numericSize.value === undefined ? undefined : resolveControlScale(EMPTY_SCALE, numericSize.value)
)

const classList = computed(() => [
  'nm-empty',
  // 数字与档位互斥：数字走 `--sized`（变量来自内联样式），字符串走档位类
  numericSize.value === undefined ? `nm-empty--${resolvedSize.value}` : 'nm-empty--sized',
])
</script>

<template>
  <div :class="classList" :style="sizeStyle">
    <div class="nm-empty__image">
      <slot name="image">
        <img v-if="image" :src="image" :alt="description ?? ''" class="nm-empty__img" />
        <svg
          v-else
          class="nm-empty__illustration"
          viewBox="0 0 160 160"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <!-- Outer box -->
          <rect
            x="28"
            y="48"
            width="104"
            height="82"
            rx="4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            opacity="0.3"
          />
          <!-- Box lid -->
          <path
            d="M28 48 L80 62 L132 48"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            opacity="0.3"
          />
          <!-- Inner document lines -->
          <rect x="48" y="66" width="64" height="6" rx="2" fill="currentColor" opacity="0.12" />
          <rect x="48" y="80" width="48" height="6" rx="2" fill="currentColor" opacity="0.12" />
          <rect x="48" y="94" width="56" height="6" rx="2" fill="currentColor" opacity="0.12" />
          <!-- Magnifying glass -->
          <circle
            cx="116"
            cy="116"
            r="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            opacity="0.25"
          />
          <line
            x1="127"
            y1="127"
            x2="138"
            y2="138"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            opacity="0.25"
          />
        </svg>
      </slot>
    </div>

    <div v-if="description" class="nm-empty__description">
      {{ description }}
    </div>

    <div v-if="$slots.default" class="nm-empty__footer">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--nm-spacing-xl) var(--nm-spacing-md);
  text-align: center;
  color: var(--nm-text-placeholder);
  user-select: none;
}

// --- Sizes ---

.nm-empty--small {
  .nm-empty__illustration {
    width: 60px;
    height: 60px;
  }

  .nm-empty__img {
    max-width: 60px;
    max-height: 60px;
  }

  .nm-empty__description {
    margin-top: var(--nm-spacing-xs);
    font-size: var(--nm-font-sm);
  }

  .nm-empty__footer {
    margin-top: var(--nm-spacing-sm);
  }
}

.nm-empty--medium {
  .nm-empty__illustration {
    width: 100px;
    height: 100px;
  }

  .nm-empty__img {
    max-width: 100px;
    max-height: 100px;
  }

  .nm-empty__description {
    margin-top: var(--nm-spacing-sm);
    font-size: var(--nm-font-base);
  }

  .nm-empty__footer {
    margin-top: var(--nm-spacing-md);
  }
}

.nm-empty--large {
  .nm-empty__illustration {
    width: 140px;
    height: 140px;
  }

  .nm-empty__img {
    max-width: 140px;
    max-height: 140px;
  }

  .nm-empty__description {
    margin-top: var(--nm-spacing-md);
    font-size: var(--nm-font-lg);
  }

  .nm-empty__footer {
    margin-top: var(--nm-spacing-lg);
  }
}

// 数字尺寸（`:size="100"`）：几何量全部来自内联 CSS 变量，见 utils/controlScale。
// 档位 class 一行未改；数字路径不挂档位类，因此只需在这里把 `sz-*` 接到同样的声明上。
// 注意插图（svg）与图片（img 的 max-width/max-height）是两套属性，必须一起接，
// 否则自定义图片会撑破字号已经缩小的容器。
.nm-empty--sized {
  .nm-empty__illustration {
    width: var(--nm-empty-sz-illustration);
    height: var(--nm-empty-sz-illustration);
  }

  .nm-empty__img {
    max-width: var(--nm-empty-sz-illustration);
    max-height: var(--nm-empty-sz-illustration);
  }

  .nm-empty__description {
    // 间距不在锚点表里（spec 不覆盖），数字通道沿用 medium 基线，
    // 避免为了两处 margin 再引入第二套尺度
    margin-top: var(--nm-spacing-sm);
    font-size: var(--nm-empty-sz-font);
  }

  .nm-empty__footer {
    margin-top: var(--nm-spacing-md);
  }
}

// --- Image wrapper ---

.nm-empty__image {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nm-empty__illustration {
  color: var(--nm-text-disabled);
}

.nm-empty__img {
  object-fit: contain;
}

// --- Description ---

.nm-empty__description {
  color: var(--nm-text-secondary);
  line-height: 1.5;
  max-width: 320px;
}

// --- Footer ---

.nm-empty__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--nm-spacing-sm);
  flex-wrap: wrap;
}

// --- Reduced motion ---

@media (prefers-reduced-motion: reduce) {
  .nm-empty {
    transition: none !important;
    animation: none !important;
  }
}
</style>
