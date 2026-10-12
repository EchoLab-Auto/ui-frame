<script setup lang="ts">
import { computed } from 'vue'

export type PixelFontAlign = 'left' | 'center' | 'right'

export interface NeumorphismPixelFontProps {
  /** 要渲染的文本（`\n` 换行；按字符栅格原样保留空白） */
  text: string
  /** 整数缩放倍率（1 = 11px 设计尺寸；非整数会被取整，位图字体须整数倍缩放才保持像素锐利） */
  scale?: number
  /** 末尾追加闪烁块光标（reduced-motion 下常亮不闪） */
  cursor?: boolean
  /** 文本对齐方式 */
  align?: PixelFontAlign
  /** 无障碍名称；传入时根元素标记为 `role="img"`（内部文本读屏时隐藏） */
  ariaLabel?: string
}

const props = withDefaults(defineProps<NeumorphismPixelFontProps>(), {
  scale: 3,
  cursor: false,
  align: 'left',
})

/** 位图字体只在整数倍设计尺寸下逐像素对齐——规整为 >=1 的整数 */
const normalizedScale = computed(() => Math.max(1, Math.round(props.scale)))

/** 缩放倍率经 CSS 变量下传（font-size 在样式表中按设计单元计算） */
const rootStyle = computed(() => ({
  '--nm-pixel-font-scale': String(normalizedScale.value),
}))
</script>

<template>
  <div
    class="nm-pixel-font"
    :class="`nm-pixel-font--${align}`"
    :style="rootStyle"
    :role="ariaLabel ? 'img' : undefined"
    :aria-label="ariaLabel || undefined"
  >
    <span class="nm-pixel-font__text"
      >{{ text }}<span v-if="cursor" class="nm-pixel-font__cursor" aria-hidden="true"
    /></span>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

// ============================================================
// termsyn 6x11 — 位图字体（stlarch 作；基于 Terminus 与 Tamsyn，GPL-2）
// 出处: https://sourceforge.net/projects/termsyn/
// 本库内嵌版由 PCF 位图重建为像素轮廓字体 → woff2：
//   1 设计像素 = 1px（字号 11px），整数倍缩放保持像素网格对齐；
//   附带 700 字重的粗体字面（termsyn6x11b）。
// ============================================================
@font-face {
  font-family: 'Termsyn 6x11';
  src: url('./termsyn-6x11.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Termsyn 6x11';
  src: url('./termsyn-6x11-bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

.nm-pixel-font {
  // termsyn 6x11 的设计单元（物理常量，非设计 token）：单元 11px、字身高 7px
  --nm-pixel-font-unit: 11px;

  color: var(--nm-text-primary);
  font-family: 'Termsyn 6x11', monospace;
  font-size: calc(var(--nm-pixel-font-unit) * var(--nm-pixel-font-scale, 3));
  line-height: 1;
  // 栅格保真：禁用字距/词距继承与字重合成，防止宿主样式破坏像素网格
  letter-spacing: 0;
  word-spacing: 0;
  font-synthesis: none;
  @include nm-theme-transition;

  &--left {
    text-align: left;
  }

  &--center {
    text-align: center;
  }

  &--right {
    text-align: right;
  }
}

// 按字符栅格原样渲染（保留 `\n` 与缩进；只在显式换行处折行）
.nm-pixel-font__text {
  white-space: pre;
}

// 块状光标：宽 1 设计单元、高 7 设计单元（大写高度），随字号等比缩放
.nm-pixel-font__cursor {
  display: inline-block;
  width: calc(1em / 11);
  height: calc(7em / 11);
  margin-left: calc(1em / 11);
  vertical-align: baseline;
  background-color: currentColor;
  animation: nm-pixel-font-blink 1.06s steps(1, end) infinite;
}

@keyframes nm-pixel-font-blink {
  0%,
  49.9% {
    opacity: 1;
  }

  50%,
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-pixel-font {
    transition: none;
  }

  // 光标保持常亮，不闪烁
  .nm-pixel-font__cursor {
    animation: none;
  }
}
</style>
