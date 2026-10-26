<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'

// ---- 配置台状态 ----
const variant = ref<TagVariant>('primary')
const closable = ref(false)
const rounded = ref(false)
const fontSize = ref(12)
/**
 * 标签的显隐。
 *
 * 关闭（`@close`）之后标签就被 `v-if` 移出 DOM 了——没有这个开关，「可关闭」这个示例
 * 关一次就永久消失，只能刷新页面。预览台与下方「可关闭与尺寸」块共用同一份状态，
 * 两处都留了恢复入口。
 */
const tagVisible = ref(true)

const variantOptions = [
  { label: '默认', value: 'default' },
  { label: '主要', value: 'primary' },
  { label: '成功', value: 'success' },
  { label: '警告', value: 'warning' },
  { label: '错误', value: 'error' },
  { label: '信息', value: 'info' },
]

/** 预览与变体格子里都用中文名，比清一色「标签」更容易对上 variant */
const variantLabel: Record<TagVariant, string> = {
  default: '默认',
  primary: '主要',
  success: '成功',
  warning: '警告',
  error: '错误',
  info: '信息',
}

function reset() {
  variant.value = 'primary'
  closable.value = false
  rounded.value = false
  fontSize.value = 12
  tagVisible.value = true
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = []
  if (variant.value !== 'default') attrs.push(`variant="${variant.value}"`)
  if (closable.value) attrs.push('closable')
  if (rounded.value) attrs.push('rounded')
  // closable 只画出关闭按钮，真正的移除逻辑得消费方自己写，片段里一并带上才可粘贴
  if (closable.value) attrs.push('@close="visible = false"')
  // size 的语义是字号，默认 12px 即 medium 锚点，偏离才写出来
  if (fontSize.value !== 12) attrs.push(`:size="${fontSize.value}"`)
  const open = attrs.length ? `<NeumorphismTag ${attrs.join(' ')}>` : '<NeumorphismTag>'
  return `${open}${variantLabel[variant.value]}</NeumorphismTag>`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <div class="demo-size-tag">
        <NeumorphismTag
          v-if="tagVisible"
          :variant="variant"
          :size="fontSize"
          :closable="closable"
          :rounded="rounded"
          @close="tagVisible = false"
        >
          {{ variantLabel[variant] }}
        </NeumorphismTag>
        <NeumorphismButton v-else variant="pressed" size="small" @click="tagVisible = true">
          已关闭 · 点此恢复
        </NeumorphismButton>
      </div>

      <template #spec>
        variant=<b>{{ variant }}</b> · closable=<b>{{ closable ? '开' : '关' }}</b> · rounded=<b>{{
          rounded ? '开' : '关'
        }}</b>
        · 字号=<b>{{ fontSize }}px</b> · visible=<b>{{ tagVisible ? '是' : '否' }}</b>
      </template>

      <template #hint>
        <code>closable</code> 只负责画出关闭按钮并抛 <code>@close</code>，真正的移除由消费方
        <code>v-if</code> 完成；字号没有 prop，靠演示级 CSS 变量 <code>--demo-tag-f</code> 桥接。
      </template>

      <template #config>
        <DemoField label="变体 variant">
          <NeumorphismSegmented v-model="variant" :options="variantOptions" size="small" />
        </DemoField>

        <DemoField label="字号" :value="`${fontSize}px`" grow>
          <NeumorphismSlider v-model="fontSize" :min="10" :max="16" :step="1" size="small" />
        </DemoField>

        <DemoField label="状态">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="closable" size="small" />
              <span>closable</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="rounded" size="small" />
              <span>rounded</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
          <NeumorphismButton
            variant="pressed"
            size="small"
            :disabled="tagVisible"
            @click="tagVisible = true"
          >
            恢复标签
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
