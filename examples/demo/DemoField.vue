<script setup lang="ts">
/**
 * 配置台里的单行参数：标签 + 控件 + 右侧读数。
 *
 * 三种控件（Segmented / Slider / Switch）的行布局完全一致，抽出来后
 * 「标签对齐、读数右缘同一条线」这件事只写一遍。
 */
withDefaults(
  defineProps<{
    /** 参数名，如 `变体 variant` */
    label: string
    /** 右侧读数（如 `44px` / `0.008`）；不传则不占位 */
    value?: string
    /** 标签最小宽度，长参数名可调大 */
    labelWidth?: string
    /** 让控件撑满剩余宽度（滑块常用） */
    grow?: boolean
  }>(),
  { value: '', labelWidth: '78px', grow: false }
)
</script>

<template>
  <div class="demo-field">
    <span class="demo-field__label" :style="{ minWidth: labelWidth }">{{ label }}</span>
    <div class="demo-field__control" :class="{ 'demo-field__control--grow': grow }">
      <slot />
    </div>
    <code v-if="value" class="demo-field__value">{{ value }}</code>
  </div>
</template>
