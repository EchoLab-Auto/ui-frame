<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type ThemeValue = 'light' | 'dark' | 'auto'

// ---- 配置台状态 ----
const themeToggleValue = ref<ThemeValue>('auto')
const themeToggleSize = ref<'small' | 'medium' | 'large'>('medium')
/** 尺寸桥接只挂在 medium 档上（.demo-size-theme-toggle 的选择器写死了 --medium） */
const themeToggleHeight = ref(35)
const disableAuto = ref(false)

const sizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]

/**
 * 桥接类只在 medium 档生效。
 *
 * `.demo-size-theme-toggle` 的每条规则都带 `.nm-theme-toggle--medium` 前缀——这是全局样式
 * 里刻意写死的：small / large 有自己的 token，硬改会把两档几何混在一起。所以选别的档位时
 * 高度滑块不起作用，这里显式把类摘掉，避免「滑块动了但没变化」的假象。
 */
const heightBridgeActive = computed(() => themeToggleSize.value === 'medium')

const bridgeStyle = computed(() =>
  heightBridgeActive.value ? { '--demo-theme-toggle-h': `${themeToggleHeight.value}px` } : undefined
)

/**
 * disableAuto 只是把 auto 选项从选项表里过滤掉，**不会**改写 modelValue。
 *
 * 所以关掉自动模式时若不主动落到 light/dark，三态里没有任何按钮高亮（值仍是 'auto'）。
 * 演示里替用户补这一步，并在 hint 里说明——这是使用这个 prop 最容易踩的坑。
 */
watch(disableAuto, disabled => {
  if (disabled && themeToggleValue.value === 'auto') themeToggleValue.value = 'light'
})

/** 切换会写进全局 useTheme：整个示例站跟着变，这是组件设计而不是演示 bug */
function reset() {
  themeToggleValue.value = 'auto'
  themeToggleSize.value = 'medium'
  themeToggleHeight.value = 35
  disableAuto.value = false
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = ['v-model="theme"']
  if (themeToggleSize.value !== 'medium') attrs.push(`size="${themeToggleSize.value}"`)
  if (disableAuto.value) attrs.push(':disable-auto="true"')
  return `<NeumorphismThemeToggle ${attrs.join(' ')} />`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（三态 · 尺寸 · 禁用自动）</h4>
    <DemoPlayground :snippet="snippet" :stage-switch="false">
      <div :class="{ 'demo-size-theme-toggle': heightBridgeActive }" :style="bridgeStyle">
        <NeumorphismThemeToggle
          v-model="themeToggleValue"
          :size="themeToggleSize"
          :disable-auto="disableAuto"
        />
      </div>

      <template #spec>
        当前值=<b>{{ themeToggleValue }}</b> · size=<b>{{ themeToggleSize }}</b> · disableAuto=<b>{{
          disableAuto
        }}</b>
        <template v-if="heightBridgeActive">
          · 高度=<b>{{ themeToggleHeight }}px</b></template
        >
      </template>

      <template #hint>
        <code>light / dark / auto</code> 三态直接写进全局 <code>useTheme</code>：切一下整站都变。
        这是组件的职责。<br />
        <code>disableAuto</code> 只过滤选项、不改值——若值是
        <code>auto</code> 就一个按钮都不高亮，本演示会自动落到 <code>light</code> 帮你避开这个坑。
      </template>

      <template #config>
        <DemoField label="尺寸 size">
          <NeumorphismSegmented v-model="themeToggleSize" :options="sizeOptions" size="small" />
        </DemoField>

        <DemoField label="高度" :value="`${themeToggleHeight}px`" grow>
          <NeumorphismSlider
            v-model="themeToggleHeight"
            :min="30"
            :max="56"
            :step="2"
            size="small"
          />
        </DemoField>

        <DemoField label="禁用自动 disableAuto" :value="String(disableAuto)">
          <label class="demo-toggle">
            <NeumorphismSwitch v-model="disableAuto" size="small" />
            <span>只剩 light / dark</span>
          </label>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
        </DemoField>
      </template>
    </DemoPlayground>
    <p class="demo-hint">
      高度滑块走的是 <code>.demo-size-theme-toggle</code> 的演示级 CSS 桥接（组件本身只有
      <code>small / medium / large</code> 三档），且只作用于 <code>medium</code>
      档；选小/大时滑块不生效是有意的。
    </p>
  </div>
</template>
