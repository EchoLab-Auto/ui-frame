<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField, type DemoStage } from '../../demo'

type CardGlass = 'none' | 'float' | 'raised' | 'pressed'
type CardHover = 'none' | 'bulge' | 'sink'

// ---- 配置台状态 ----
/**
 * 默认 2 级。
 *
 * 卡片的 `elevation` 缺省时会走 `variant` / `depth` 的兼容路径，而 `depth` 缺省是
 * `medium`（= 2 级）——所以「一个属性都不写」渲染出来就是 2 级。配置台从 2 起步，
 * 实时代码片段才能据此省略该属性。
 */
const elevation = ref(2)
const glass = ref<CardGlass>('none')
const hoverable = ref<CardHover>('none')
/** 圆角（px）。默认 24 = 组件默认值，配置台从这里起步，片段才能省略该属性 */
const radius = ref(24)
const squircle = ref(false)
/** 头部 / 底部插槽：卡片只有这两个「结构位」，其余全是材质参数 */
const showHeader = ref(false)
const showFooter = ref(false)
/**
 * 预览台默认彩色。
 *
 * 玻璃档位的观感来自半透明底 + `backdrop-filter` 磨砂 + 1px 高光边，平面（纯色）背景
 * 上几乎看不出层次；默认给彩色渐变，切回「彩色 / 平面」可以对照。
 */
const stage = ref<DemoStage>('gradient')

const glassOptions = [
  { label: '关闭', value: 'none' },
  { label: '悬浮', value: 'float' },
  { label: '凸面', value: 'raised' },
  { label: '凹陷', value: 'pressed' },
]
const hoverableOptions = [
  { label: '关闭', value: 'none' },
  { label: '膨胀', value: 'bulge' },
  { label: '下沉', value: 'sink' },
]

/**
 * 关闭玻璃必须显式传 `false`，不能传 `undefined`。
 *
 * 组件内部是 `resolveProp(glass, config.card.glass, undefined)`：`undefined` 等于
 * 「没表态」，全局配置里的 `card.glass` 会照常生效——那样配置台的「关闭」就关不掉了。
 */
const glassValue = computed<false | Exclude<CardGlass, 'none'>>(() =>
  glass.value === 'none' ? false : glass.value
)

/** 同理：`hoverable` 关闭也传 `false`，否则 `config.card.hoverable` 会漏进来 */
const hoverableValue = computed<false | Exclude<CardHover, 'none'>>(() =>
  hoverable.value === 'none' ? false : hoverable.value
)

/**
 * 悬停后的实际台阶高度。
 *
 * 阴影是在 CSS 里逐档写死的（`nm-card--hover-bulge` / `--hover-sink`），规则有一条
 * 共同约束：**不跨越 0 线**——膨胀最多到 +4、最多回到 0；下沉最多到 -4、最多回到 0。
 * 若按 `elevation ± 2` 简单算，`-2` 悬停膨胀会算成 `0`（对）但 `-1` 会算成 `+1`（错，实际
 * 回到 0），读数就和渲染对不上了，所以这里复刻同一套映射。
 */
function hoverTarget(e: number): number {
  if (hoverable.value === 'none') return e
  if (hoverable.value === 'bulge') return e >= 0 ? Math.min(4, e + 2) : Math.min(0, e + 2)
  return e <= 0 ? Math.max(-4, e - 2) : Math.max(0, e - 2)
}

/** 预览卡片上的悬停读数（关闭悬停时明确写「不抬升」，比留空好读） */
const hoverText = computed(() => {
  const from = elevation.value
  const to = hoverTarget(from)
  return to === from ? '不抬升' : `${from} → ${to}`
})

function reset() {
  elevation.value = 2
  glass.value = 'none'
  hoverable.value = 'none'
  radius.value = 24
  squircle.value = false
  showHeader.value = false
  showFooter.value = false
}

/** 「套用玻璃」：顺手把台面切到彩色，否则玻璃在平面背景上几乎看不出磨砂 */
function useGlass() {
  glass.value = 'float'
  stage.value = 'gradient'
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = []
  if (elevation.value !== 2) attrs.push(`:elevation="${elevation.value}"`)
  if (glass.value !== 'none') attrs.push(`glass="${glass.value}"`)
  if (hoverable.value !== 'none') attrs.push(`hoverable="${hoverable.value}"`)
  if (radius.value !== 24) attrs.push(`:radius="${radius.value}"`)
  if (squircle.value) attrs.push('squircle')
  const open = attrs.length ? `<NeumorphismCard ${attrs.join(' ')}>` : '<NeumorphismCard>'
  const slots = [
    showHeader.value ? '  <template #header>卡片标题</template>' : '',
    showFooter.value ? '  <template #footer>底部信息</template>' : '',
  ].filter(Boolean)
  return `${open}\n${slots.length ? slots.join('\n') + '\n' : ''}  卡片内容\n</NeumorphismCard>`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground v-model:stage="stage" :snippet="snippet">
      <NeumorphismCard
        :elevation="elevation"
        :glass="glassValue"
        :hoverable="hoverableValue"
        :radius="radius"
        :squircle="squircle"
        style="width: 260px"
      >
        <template v-if="showHeader" #header>
          <strong style="font-size: 13px">卡片标题</strong>
        </template>
        <strong style="font-size: 13px">台阶高度 {{ elevation }}</strong>
        <p style="margin: 4px 0 0; font-size: 12px; color: var(--nm-text-secondary)">
          悬停 {{ hoverText }}
        </p>
        <template v-if="showFooter" #footer>
          <span style="font-size: 11px; color: var(--nm-text-placeholder)">底部信息</span>
        </template>
      </NeumorphismCard>

      <template #spec>
        elevation=<b>{{ elevation }}</b> · glass=<b>{{ glass }}</b> · hoverable=<b>{{
          hoverable
        }}</b>
        · radius=<b>{{ radius }}px</b> · squircle=<b>{{ squircle }}</b>
      </template>

      <template #hint>
        悬停膨胀 / 下沉都不跨越 0 线（±4 封顶，回到 0 就停），所以 <code>-2</code> 膨胀是回到 0
        而不是到 +4；玻璃档位只在彩色背景上看得到磨砂。
      </template>

      <template #config>
        <DemoField label="高度 elevation" :value="String(elevation)" grow>
          <NeumorphismSlider v-model="elevation" :min="-4" :max="4" :step="1" size="small" />
        </DemoField>

        <DemoField label="玻璃 glass">
          <NeumorphismSegmented v-model="glass" :options="glassOptions" size="small" />
        </DemoField>

        <DemoField label="悬停 hoverable">
          <NeumorphismSegmented v-model="hoverable" :options="hoverableOptions" size="small" />
        </DemoField>

        <DemoField label="圆角 radius" :value="`${radius}px`" grow>
          <NeumorphismSlider v-model="radius" :min="0" :max="48" :step="1" size="small" />
        </DemoField>

        <DemoField label="超椭圆 squircle" :value="squircle ? '开' : '关'">
          <NeumorphismSwitch v-model="squircle" size="small" />
        </DemoField>

        <DemoField label="插槽">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="showHeader" size="small" />
              <span>#header</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="showFooter" size="small" />
              <span>#footer</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
          <NeumorphismButton variant="pressed" size="small" @click="useGlass()">
            套用玻璃
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
