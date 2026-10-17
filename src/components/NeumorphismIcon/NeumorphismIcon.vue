<script setup lang="ts">
/**
 * 线框单色图标（Design Philosophy §8「图标体系」）。
 *
 * 把 `src/icons/registry.ts` 的语义名渲染为 SVG——内置组件与消费方共用同
 * 一套几何，不再各自内联 `<path>`。尺寸取 `--nm-icon-size-*` 七档，线宽按档
 * 自动（≤12 → 2.5 微图标补偿；≥24 → 1.5 大图标轻描；其余 2）。
 *
 * @example
 * ```vue
 * <NeumorphismIcon name="close" />                       <!-- 默认 sm 14px -->
 * <NeumorphismIcon name="chevron-down" size="xs" />
 * <NeumorphismIcon name="check" :stroke-width="3" />     <!-- 勾选语义强调 -->
 * <NeumorphismIcon name="refresh" spin />
 * <NeumorphismIcon name="warning" label="高风险" />
 * ```
 */
import { computed } from 'vue'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import {
  ICON_REGISTRY,
  ICON_SIZE_PX,
  defaultStrokeWidth,
  type IconDefinition,
  type IconName,
  type IconSize,
} from '@/icons/registry'

export interface NeumorphismIconProps {
  /** 语义图标名（见 `ICON_NAMES`） */
  name: IconName
  /** 尺寸：档位（xs/sm/md/lg/xl/2xl/3xl）或数字（须为 12/14/16/18/20/24/32） */
  size?: IconSize | number
  /** 覆盖线宽（缺省按尺寸档自动；合法值 0.5/1/1.5/2/2.5/3） */
  strokeWidth?: number
  /** 匀速旋转（加载中） */
  spin?: boolean
  /** 呼吸脉冲（等待/连接中） */
  pulse?: boolean
  /** 无障碍标签；留空 = 装饰性图标（`aria-hidden`） */
  label?: string
}

const props = withDefaults(defineProps<NeumorphismIconProps>(), {
  size: undefined,
  strokeWidth: undefined,
  spin: false,
  pulse: false,
  label: '',
})

const { resolveProp } = useNeumorphismSetup()

const resolvedSize = computed<IconSize | number>(() =>
  resolveProp(props.size, undefined, 'sm' as IconSize | number)
)

/** 显示像素：档位查表；数字直传（非枚举值仍渲染，但由 check:icons 校验拦下） */
const px = computed(() => {
  const s = resolvedSize.value
  if (typeof s === 'number') return s
  return (ICON_SIZE_PX as Record<string, number>)[s] ?? ICON_SIZE_PX.sm
})

/** 线宽：显式 prop > 按尺寸档自动 */
const strokeWidth = computed(() => props.strokeWidth ?? defaultStrokeWidth(px.value))

const definition = computed<IconDefinition>(
  () => (ICON_REGISTRY[props.name] ?? ICON_REGISTRY.close) as IconDefinition
)

const classes = computed(() => [
  'nm-icon',
  `nm-icon--${props.name}`,
  {
    'nm-icon--spin': props.spin,
    'nm-icon--pulse': props.pulse,
    'nm-icon--filled': definition.value.filled === true,
  },
])
</script>

<template>
  <svg
    :class="classes"
    :width="px"
    :height="px"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-hidden="label ? undefined : 'true'"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    focusable="false"
  >
    <path v-for="(d, i) in definition.paths" :key="i" :d="d" />
  </svg>
</template>

<style scoped lang="scss">
// 图标不参与行高计算（避免把行撑高），并保持行内垂直居中
.nm-icon {
  flex: 0 0 auto;
  display: inline-block;
  vertical-align: middle;
  color: inherit;
}

// 实心图标（dot / grip / more 等）：几何自带 fill，描边关闭
.nm-icon--filled {
  fill: currentColor;
  stroke: none;
}

// 旋转：以自身中心为轴（transform-box 锁定，避免 SVG 坐标系偏移）
.nm-icon--spin {
  transform-box: view-box;
  transform-origin: center;
  animation: nm-icon-spin 1s linear infinite;
}

@keyframes nm-icon-spin {
  to {
    transform: rotate(360deg);
  }
}

// 呼吸：只动透明度，不位移/缩放（避免列表里"跳动"）
.nm-icon--pulse {
  animation: nm-icon-pulse 1.6s ease-in-out infinite;
}

@keyframes nm-icon-pulse {
  50% {
    opacity: 0.35;
  }
}

// 尊重系统的"减少动态"偏好
@media (prefers-reduced-motion: reduce) {
  .nm-icon--spin,
  .nm-icon--pulse {
    animation: none;
  }
}
</style>
