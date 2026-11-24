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
 * <NeumorphismIcon name="warning" tone="warning" label="高风险" />
 * <NeumorphismIcon name="check-circle" tone="success" />
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

/**
 * 语义色调（图标取色，不再是单一 `currentColor`）。
 *
 * 值全部来自主题令牌，深色主题自动跟随：
 * - `accent` → `--nm-accent-text`（**可读**强调色，不是亮 lime 填充色）
 * - `muted` → `--nm-text-secondary`
 * - `success` / `warning` / `error` / `info` → `--nm-color-*`
 *
 * 产品专属语义（如「推理中」「子代理」）不进库，调用方用 `style="color: …"`
 * 传自己的令牌——`inherit` 档就是纯 `currentColor`。
 */
export type NeumorphismIconTone =
  'inherit' | 'accent' | 'muted' | 'success' | 'warning' | 'error' | 'info'

export interface NeumorphismIconProps {
  /** 语义图标名（见 `ICON_NAMES`） */
  name: IconName
  /** 尺寸：档位（xs/sm/md/lg/xl/2xl/3xl）或数字（须为 12/14/16/18/20/24/32） */
  size?: IconSize | number
  /** 覆盖线宽（缺省按尺寸档自动；合法值 0.5/1/1.5/2/2.5/3） */
  strokeWidth?: number
  /** 语义色调（缺省 `inherit` = 跟随 `currentColor`） */
  tone?: NeumorphismIconTone
  /** 匀速旋转（加载中） */
  spin?: boolean
  /** 呼吸脉冲（等待/连接中） */
  pulse?: boolean
  /** 无障碍标签；留空 = 装饰性图标（`aria-hidden`） */
  label?: string
  /**
   * 无障碍标签的别名（与 `label` 等价，`ariaLabel` 优先）。
   *
   * 产品侧历史写法是 `ariaLabel`，保留它让 `<PanelIcon>` 一类薄封装可以
   * 原地替换成这个组件而不改调用点。
   */
  ariaLabel?: string
}

const props = withDefaults(defineProps<NeumorphismIconProps>(), {
  size: undefined,
  strokeWidth: undefined,
  tone: 'inherit',
  spin: false,
  pulse: false,
  label: '',
  ariaLabel: '',
})

const { resolveProp } = useNeumorphismSetup()

/** 无障碍名：`ariaLabel` 优先（产品侧命名），否则 `label` */
const a11yLabel = computed(() => props.ariaLabel || props.label)

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
    // tone 前缀是必需的：语义名里本来就有 `warning` / `info`，
    // 裸 `nm-icon--warning` 会与「warning 图标」的钩子撞在一起
    [`nm-icon--tone-${props.tone}`]: props.tone !== 'inherit',
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
    :aria-hidden="a11yLabel ? undefined : 'true'"
    :role="a11yLabel ? 'img' : undefined"
    :aria-label="a11yLabel || undefined"
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

// 语义色调——只改 color，几何与线宽不变（令牌随主题切换）
.nm-icon--tone-accent {
  color: var(--nm-accent-text);
}
.nm-icon--tone-muted {
  color: var(--nm-text-secondary);
}
.nm-icon--tone-success {
  color: var(--nm-color-success);
}
.nm-icon--tone-warning {
  color: var(--nm-color-warning);
}
.nm-icon--tone-error {
  color: var(--nm-color-error);
}
.nm-icon--tone-info {
  color: var(--nm-color-info);
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
