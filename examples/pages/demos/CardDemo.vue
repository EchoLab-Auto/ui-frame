<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField, type DemoStage } from '../../demo'

type CardGlass = 'none' | 'float' | 'raised' | 'pressed'
type CardHover = 'none' | 'bulge' | 'sink'
type CardRadius = 'small' | 'medium' | 'large' | 'xl'

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
const radius = ref<CardRadius>('large')
const squircle = ref(false)
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
const radiusOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
  { label: 'XL', value: 'xl' },
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
  radius.value = 'large'
  squircle.value = false
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
  if (radius.value !== 'large') attrs.push(`radius="${radius.value}"`)
  if (squircle.value) attrs.push('squircle')
  const open = attrs.length ? `<NeumorphismCard ${attrs.join(' ')}>` : '<NeumorphismCard>'
  return `${open}\n  卡片内容\n</NeumorphismCard>`
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
        <strong style="font-size: 13px">台阶高度 {{ elevation }}</strong>
        <p style="margin: 4px 0 0; font-size: 12px; color: var(--nm-text-secondary)">
          悬停 {{ hoverText }}
        </p>
      </NeumorphismCard>

      <template #spec>
        elevation=<b>{{ elevation }}</b> · glass=<b>{{ glass }}</b> · hoverable=<b>{{
          hoverable
        }}</b>
        · radius=<b>{{ radius }}</b> · squircle=<b>{{ squircle }}</b>
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

        <DemoField label="圆角 radius">
          <NeumorphismSegmented v-model="radius" :options="radiusOptions" size="small" />
        </DemoField>

        <DemoField label="超椭圆 squircle" :value="squircle ? '开' : '关'">
          <NeumorphismSwitch v-model="squircle" size="small" />
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

  <div class="demo-block">
    <h4 class="demo-label">凸起（1 到 4 级）</h4>
    <div class="demo-row demo-row--cards">
      <NeumorphismCard
        v-for="e in 4"
        :key="e"
        :elevation="e"
        style="width: 140px; text-align: center"
      >
        <strong>{{ e }}</strong>
      </NeumorphismCard>
    </div>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">凹陷（-1 到 -4 级）</h4>
    <div class="demo-row demo-row--cards">
      <NeumorphismCard
        v-for="e in 4"
        :key="-e"
        :elevation="-e"
        style="width: 140px; text-align: center"
      >
        <strong>{{ -e }}</strong>
      </NeumorphismCard>
    </div>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">悬停膨胀（elevation += 2）</h4>
    <div class="demo-row demo-row--cards">
      <NeumorphismCard :elevation="1" hoverable="bulge" style="width: 140px; text-align: center"
        >1 → 3</NeumorphismCard
      >
      <NeumorphismCard :elevation="-2" hoverable="bulge" style="width: 140px; text-align: center"
        >-2 → 0</NeumorphismCard
      >
      <NeumorphismCard :elevation="0" hoverable="bulge" style="width: 140px; text-align: center"
        >0 → 2</NeumorphismCard
      >
    </div>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">带头部和底部</h4>
    <NeumorphismCard :elevation="2" style="max-width: 480px">
      <template #header>
        <strong>卡片标题</strong>
      </template>
      <p style="color: var(--nm-text-secondary); font-size: 13px">
        这是卡片的主要内容区域。您可以在这里放置任意组件或文字。
      </p>
      <template #footer>
        <span style="color: var(--nm-text-placeholder); font-size: 12px">
          底部信息 · 2024-01-01
        </span>
      </template>
    </NeumorphismCard>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">玻璃拟态（磨砂玻璃：置于彩色背景上可见半透明与模糊，hover 抬升）</h4>
    <div class="demo-glass-backdrop demo-glass-backdrop--cards">
      <NeumorphismCard glass style="width: 168px">
        <div class="demo-glass-card-title">悬浮玻璃</div>
        <code class="demo-glass-code">glass="float"</code>
      </NeumorphismCard>
      <NeumorphismCard glass="raised" :elevation="2" style="width: 168px">
        <div class="demo-glass-card-title">凸面玻璃</div>
        <code class="demo-glass-code">glass="raised"</code>
      </NeumorphismCard>
      <NeumorphismCard glass="pressed" :elevation="-2" style="width: 168px">
        <div class="demo-glass-card-title">凹陷玻璃</div>
        <code class="demo-glass-code">glass="pressed"</code>
      </NeumorphismCard>
      <NeumorphismCard glass hoverable style="width: 168px">
        <div class="demo-glass-card-title">悬停抬升</div>
        <code class="demo-glass-code">glass + hoverable</code>
      </NeumorphismCard>
    </div>
    <p class="demo-hint" style="margin-top: 10px">
      玻璃只替换<strong>表面材质</strong>（半透明底 + <code>backdrop-filter</code> 模糊 + 1px
      高光边），台阶高度模型仍由 <code>elevation</code> 决定—— <code>raised</code> /
      <code>pressed</code> 的阴影强度跟随 <code>|elevation|</code>；<code>true</code> 等价于
      <code>'float'</code>（旧布尔语义）。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">玻璃档位与高度组合（1–4 级）</h4>
    <div class="demo-glass-backdrop demo-glass-backdrop--cards">
      <NeumorphismCard
        v-for="e in 4"
        :key="`gr-${e}`"
        glass="raised"
        :elevation="e"
        style="width: 96px; text-align: center"
      >
        <strong>{{ e }}</strong>
      </NeumorphismCard>
    </div>
    <div class="demo-glass-backdrop demo-glass-backdrop--cards" style="margin-top: 12px">
      <NeumorphismCard
        v-for="e in 4"
        :key="`gp-${e}`"
        glass="pressed"
        :elevation="-e"
        style="width: 96px; text-align: center"
      >
        <strong>{{ -e }}</strong>
      </NeumorphismCard>
    </div>
    <p class="demo-hint">
      玻璃档位与 <code>elevation</code> 正交：同一档 <code>raised</code> 下 1→4
      级只是阴影强度递增，材质不变。
    </p>
  </div>
</template>
