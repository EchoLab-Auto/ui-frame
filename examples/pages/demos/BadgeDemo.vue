<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type BadgeHost = 'button' | 'avatar'

// ---- 配置台状态 ----
const value = ref(5)
/** 组件默认 `max` = 99，与默认值相同时实时代码片段会省略它 */
const max = ref(99)
const dot = ref(false)
const showZero = ref(false)
/** 被包裹的宿主：角标是绝对定位浮层，宿主可以是任意元素 */
const host = ref<BadgeHost>('button')

const hostOptions = [
  { label: 'Button', value: 'button' },
  { label: 'Avatar', value: 'avatar' },
]

function reset() {
  value.value = 5
  max.value = 99
  dot.value = false
  showZero.value = false
  host.value = 'button'
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  // value 永远要写：组件靠「value 是否为空」判断显隐，不传（或传 0 且没开 show-zero）就整个隐藏
  const attrs = [`:value="${value.value}"`]
  if (max.value !== 99) attrs.push(`:max="${max.value}"`)
  if (dot.value) attrs.push('dot')
  if (showZero.value) attrs.push('show-zero')
  const hostTag =
    host.value === 'button'
      ? '  <NeumorphismButton variant="pressed" size="small">收件箱</NeumorphismButton>'
      : '  <NeumorphismAvatar initials="AB" size="medium" />'
  return `<NeumorphismBadge ${attrs.join(' ')}>\n${hostTag}\n</NeumorphismBadge>`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <NeumorphismBadge :value="value" :max="max" :dot="dot" :show-zero="showZero">
        <NeumorphismButton v-if="host === 'button'" variant="pressed" size="small">
          收件箱
        </NeumorphismButton>
        <NeumorphismAvatar v-else initials="AB" size="medium" />
      </NeumorphismBadge>

      <template #spec>
        value=<b>{{ value }}</b> · max=<b>{{ max }}</b> · dot=<b>{{ dot ? '开' : '关' }}</b> ·
        showZero=<b>{{ showZero ? '开' : '关' }}</b> · 宿主=<b>{{ host }}</b>
      </template>

      <template #hint>
        <code>value</code> ≤ 0 且没开 <code>show-zero</code> 时整个角标隐藏；超过
        <code>max</code> 显示 <code>max+</code>。<code>dot</code> 模式不显示数字，但仍要传
        <code>value</code>——组件是用「<code>value</code> 是否为空」判断显隐的，不传就整块隐藏。
      </template>

      <template #config>
        <DemoField label="数值 value" :value="String(value)" grow>
          <NeumorphismSlider v-model="value" :min="0" :max="200" :step="1" size="small" />
        </DemoField>

        <DemoField label="上限 max" :value="String(max)" grow>
          <NeumorphismSlider v-model="max" :min="1" :max="200" :step="1" size="small" />
        </DemoField>

        <DemoField label="状态">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="dot" size="small" />
              <span>dot</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="showZero" size="small" />
              <span>show-zero</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="宿主">
          <NeumorphismSegmented v-model="host" :options="hostOptions" size="small" />
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
