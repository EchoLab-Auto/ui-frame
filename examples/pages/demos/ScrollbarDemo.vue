<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type ScrollbarVariant = 'standard' | 'primary' | 'none' | 'dots' | 'glow'

// ---- 配置台状态 ----
const variant = ref<ScrollbarVariant>('standard')
/**
 * 覆盖层颜色。组件用 normalizeColor() 归一，只认 `#rgb` / `#rrggbb` / `rgb(...)`；
 * 写成 "200,100,50" 会解析失败并回落到默认值（看不出一丝变化），所以这里用十六进制。
 */
const dotColor = ref('#999999')
const accentColor = ref('#cdfa4e')

const variantOptions = [
  { label: '标准', value: 'standard' },
  { label: '主色', value: 'primary' },
  { label: '隐藏', value: 'none' },
  { label: '点阵', value: 'dots' },
  { label: '辉光', value: 'glow' },
]

/** 只有 dots / glow 是 JS 覆盖层，才读 dotColor / accentColor */
const isOverlay = computed(() => variant.value === 'dots' || variant.value === 'glow')

/**
 * 覆盖层实例的重挂载键。
 *
 * useScrollbar 只在 start() 里 refreshColors()，之后仅 watch accentColor；
 * 改 dotColor 不会重算点阵色。用 :key 换掉实例是成本最低的正确做法。
 */
const overlayKey = computed(() => `${variant.value}-${dotColor.value}-${accentColor.value}`)

/** 提示文案：跟着当前变体走，说清「为什么这个变体长这样」 */
const variantHint = computed(() => {
  switch (variant.value) {
    case 'standard':
      return 'standard 只声明 scrollbar-width: thin —— 外观交给浏览器/系统（Chrome 上是默认滚动条）。'
    case 'primary':
      return 'primary 用 ::-webkit-scrollbar-* 规则直接画 8px 主色拇指 + 主色辉光。'
    case 'none':
      return 'none 只是把原生滚动条藏起来，容器依旧可以滚（键盘 / 滚轮 / 触摸都行）。'
    case 'dots':
      return 'dots 是 JS 覆盖层：把目标容器的原生滚动条隐藏，再插一层点阵，滚动进度映射成游标位置。'
    default:
      return 'glow 是 JS 覆盖层：一条辉光贴在容器右缘，按滚动进度上下移动。'
  }
})

function reset() {
  variant.value = 'standard'
  dotColor.value = '#999999'
  accentColor.value = '#cdfa4e'
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = []
  if (variant.value !== 'standard') attrs.push(`variant="${variant.value}"`)
  attrs.push('target="#scroll-container"')
  // 颜色只对覆盖层有意义；CSS 类变体传了也是白传
  if (isOverlay.value) {
    attrs.push(`dot-color="${dotColor.value}"`)
    attrs.push(`accent-color="${accentColor.value}"`)
  }
  const head = `<NeumorphismScrollbar ${attrs.join(' ')} />`
  const notes: string[] = []
  if (isOverlay.value) {
    notes.push('<!-- 覆盖层变体需要真实可滚动的容器 + target 选择器；')
    notes.push('     容器必须自己有 overflow-y: auto，滚动条才挂得上 -->')
  }
  return [head, ...notes].join('\n')
})

/**
 * 变体一览：CSS 类变体（直接挂类）与覆盖层变体（靠组件 + target）分成两行。
 *
 * 分开排是为了让三列的 CSS 类变体和两列的覆盖层各自撑满一行——
 * 五行一起排会在卡片宽度不足时折成 4+1，视觉上很难看。
 */
const cssColumns = [
  { key: 'standard', id: 'nm-sb-standard-demo' },
  { key: 'primary', id: 'nm-sb-primary-demo' },
  { key: 'none', id: 'nm-sb-none-demo' },
] as const

const overlayColumns = [
  { key: 'dots', id: 'dots-demo-container' },
  { key: 'glow', id: 'glow-demo-container' },
] as const
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :stage-switch="false" :snippet="snippet">
      <div id="nm-scrollbar-demo-preview" class="demo-scroll-box" style="max-height: 200px">
        <div class="demo-scroll-box__title">{{ variant }} 变体</div>
        <div v-for="i in 24" :key="i">占位行 {{ i }} · 往下滚，看右侧滚动条</div>
      </div>
      <NeumorphismScrollbar
        :key="overlayKey"
        :variant="variant"
        target="#nm-scrollbar-demo-preview"
        :dot-color="dotColor"
        :accent-color="accentColor"
      />

      <template #spec>
        variant=<b>{{ variant }}</b> · 类型=<b>{{ isOverlay ? 'JS 覆盖层' : 'CSS 类' }}</b>
        <template v-if="isOverlay">
          · dot=<b>{{ dotColor }}</b> · accent=<b>{{ accentColor }}</b>
        </template>
      </template>

      <template #hint>
        {{ variantHint }}
        <br />
        <code>dot-color</code> / <code>accent-color</code> 只对 <code>dots</code> /
        <code>glow</code> 有意义（另外三个变体是纯 CSS 类，不读这两个 prop）；取值写
        <code>#rrggbb</code> 或 <code>rgb(...)</code>。
      </template>

      <template #config>
        <DemoField label="变体 variant">
          <NeumorphismSegmented v-model="variant" :options="variantOptions" size="small" />
        </DemoField>

        <DemoField label="点阵色 dotColor">
          <NeumorphismInput
            v-model="dotColor"
            :disabled="!isOverlay"
            size="small"
            placeholder="#999999"
          />
        </DemoField>

        <DemoField label="强调色 accentColor">
          <NeumorphismInput
            v-model="accentColor"
            :disabled="!isOverlay"
            size="small"
            placeholder="#cdfa4e"
          />
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="pressed" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">五种预设变体一览</h4>
    <div class="demo-row" style="gap: 16px; flex-wrap: wrap; align-items: stretch">
      <div
        v-for="col in cssColumns"
        :id="col.id"
        :key="col.key"
        class="demo-scroll-box"
        :class="`nm-scrollbar--${col.key}`"
        style="flex: 1; min-width: 150px"
      >
        <div class="demo-scroll-box__title">{{ col.key }}</div>
        <div v-for="i in 20" :key="i">占位行 {{ i }}</div>
      </div>
    </div>

    <div
      class="demo-row"
      style="gap: 16px; flex-wrap: wrap; align-items: stretch; margin-top: 16px"
    >
      <div
        v-for="col in overlayColumns"
        :id="col.id"
        :key="col.key"
        class="demo-scroll-box"
        style="flex: 1; min-width: 150px"
      >
        <div class="demo-scroll-box__title">{{ col.key }}</div>
        <div v-for="i in 20" :key="i">占位行 {{ i }}</div>
      </div>
    </div>

    <!--
      JS 覆盖层：必须先有真实滚动容器，再把 target 指向它。
      三个 CSS 类变体的滚动条由类自己画，覆盖层变体则由组件注入一层 25px 宽的装饰层。
    -->
    <NeumorphismScrollbar
      variant="dots"
      target="#dots-demo-container"
      dot-color="#999999"
      accent-color="#cdfa4e"
    />
    <NeumorphismScrollbar variant="glow" target="#glow-demo-container" accent-color="#cdfa4e" />

    <p class="demo-hint">
      <code>standard</code> / <code>primary</code> / <code>none</code> 是纯 CSS
      类，直接挂在滚动容器上； <code>dots</code> / <code>glow</code> 需要组件 +
      <code>target</code> 选择器，因为点阵和辉光是用 JS 注进去的覆盖层。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">CSS 变量定制度</h4>
    <div class="demo-row" style="gap: 16px; flex-wrap: wrap; align-items: stretch">
      <div
        class="demo-scroll-box nm-scrollbar--standard"
        :style="{
          '--nm-scrollbar-width': '8px',
          '--nm-scrollbar-thumb-bg': 'var(--nm-primary-color)',
          '--nm-scrollbar-thumb-radius': '4px',
          '--nm-scrollbar-thumb-shadow':
            '0 0 10px color-mix(in srgb, var(--nm-primary-color) 50%, transparent)',
        }"
        style="flex: 1; min-width: 220px"
      >
        <div class="demo-scroll-box__title">覆盖 --nm-scrollbar-* 变量</div>
        <div v-for="i in 16" :key="i">通过变量声明意图（见下方变量清单）</div>
      </div>

      <!-- 真正会改到滚动条外观的做法：覆盖预设类正在消费的 token -->
      <div
        class="demo-scroll-box nm-scrollbar--primary"
        :style="{ '--nm-primary-color': '#e0524a' }"
        style="flex: 1; min-width: 220px"
      >
        <div class="demo-scroll-box__title">覆盖 --nm-primary-color（primary 变体）</div>
        <div v-for="i in 16" :key="i">拇指颜色跟着局部 token 一起变</div>
      </div>
    </div>

    <pre
      class="code-block"
      style="margin-top: 12px; font-size: 11px"
    ><code>--nm-scrollbar-width: 8px;
--nm-scrollbar-track-bg: transparent;
--nm-scrollbar-thumb-bg: var(--nm-primary-color);
--nm-scrollbar-thumb-hover-bg: var(--nm-surface-color);
--nm-scrollbar-thumb-radius: 4px;
--nm-scrollbar-thumb-shadow: 0 0 10px ...;</code></pre>

    <p class="demo-hint">
      这几个 token 声明在主题根（<code>.nm-root</code> /
      <code>[data-theme]</code>）上，消费端却写死在 <code>::-webkit-scrollbar</code> 规则里：宽度
      5px、圆角、阴影都是硬编码，只有 <code>--nm-scrollbar-thumb-bg</code> /
      <code>-track-bg</code> 真的被 <code>scrollbar-color</code> 读到（Firefox
      生效）。所以「精确定制滚动条」的稳妥路径是 覆盖预设类在用的
      <code>--nm-primary-color</code> 这类 token，或者用 <code>dots</code> /
      <code>glow</code> 覆盖层自己画。
    </p>
  </div>
</template>
