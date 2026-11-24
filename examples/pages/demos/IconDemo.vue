<script setup lang="ts">
/**
 * NeumorphismIcon 演示：图标全集 + 尺寸档 / 线宽档 / 语义色调 / 动效。
 *
 * 图标几何来自 `src/icons/registry.ts`，演示页不重复维护清单——
 * 注册表新增一条语义，这里的图标墙自动多一格。
 */
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'
import {
  ICON_NAMES,
  ICON_SIZE_PX,
  ICON_STROKE_ALLOWED,
  type IconName,
  type IconSize,
} from '../../../src/icons/registry'
import type { NeumorphismIconTone } from '../../../src/components/NeumorphismIcon'

// ---- 配置台状态 ----
const current = ref<IconName>('sparkle')
const size = ref<IconSize>('2xl')
const tone = ref<NeumorphismIconTone>('inherit')
/** 'auto' = 由尺寸档决定线宽；数字 = 显式覆盖 */
const stroke = ref<number | 'auto'>('auto')
const spin = ref(false)
const pulse = ref(false)
const keyword = ref('')
const copied = ref(false)

const sizeOptions = (Object.keys(ICON_SIZE_PX) as IconSize[]).map(key => ({
  label: String(ICON_SIZE_PX[key]),
  value: key,
}))

const toneOptions: { label: string; value: NeumorphismIconTone }[] = [
  { label: '继承', value: 'inherit' },
  { label: '强调', value: 'accent' },
  { label: '次要', value: 'muted' },
  { label: '成功', value: 'success' },
  { label: '警告', value: 'warning' },
  { label: '错误', value: 'error' },
  { label: '信息', value: 'info' },
]

const strokeOptions: { label: string; value: number | 'auto' }[] = [
  { label: 'auto', value: 'auto' },
  ...[...ICON_STROKE_ALLOWED]
    .sort((a, b) => a - b)
    .map(width => ({
      label: String(width),
      value: width,
    })),
]

// ---- 图标全集：按语义名过滤 ----
const filtered = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return query ? ICON_NAMES.filter(name => name.includes(query)) : ICON_NAMES
})

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = [`name="${current.value}"`]
  if (size.value !== 'sm') attrs.push(`size="${size.value}"`)
  if (tone.value !== 'inherit') attrs.push(`tone="${tone.value}"`)
  if (stroke.value !== 'auto') attrs.push(`:stroke-width="${stroke.value}"`)
  if (spin.value) attrs.push('spin')
  if (pulse.value) attrs.push('pulse')
  return `<NeumorphismIcon ${attrs.join(' ')} />`
})

function pick(name: IconName) {
  current.value = name
  copied.value = false
}

/** 复制当前片段；非安全上下文（http://内网 IP）下 clipboard 不可用 → 静默忽略 */
async function copySnippet() {
  try {
    await navigator.clipboard.writeText(snippet.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1200)
  } catch {
    copied.value = false
  }
}

function reset() {
  current.value = 'sparkle'
  size.value = '2xl'
  tone.value = 'inherit'
  stroke.value = 'auto'
  spin.value = false
  pulse.value = false
  keyword.value = ''
}

/** 语义色调那一排：每个色调配一个「本来就该是这个色」的图标 */
const toneSamples: { tone: NeumorphismIconTone; name: IconName; token: string }[] = [
  { tone: 'accent', name: 'sparkle', token: '--nm-accent-text' },
  { tone: 'muted', name: 'file', token: '--nm-text-secondary' },
  { tone: 'success', name: 'check', token: '--nm-color-success' },
  { tone: 'warning', name: 'warning', token: '--nm-color-warning' },
  { tone: 'error', name: 'close', token: '--nm-color-error' },
  { tone: 'info', name: 'info', token: '--nm-color-info' },
]
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :stage-switch="false" :snippet="snippet">
      <div class="icon-preview">
        <NeumorphismIcon
          :name="current"
          :size="size"
          :tone="tone"
          :stroke-width="stroke === 'auto' ? undefined : stroke"
          :spin="spin"
          :pulse="pulse"
        />
      </div>

      <template #spec>
        name=<b>{{ current }}</b> · size=<b>{{ size }}</b> · tone=<b>{{ tone }}</b> · 线宽=<b>{{
          stroke === 'auto' ? '按档自动' : stroke
        }}</b>
        <template v-if="spin"> · spin</template>
        <template v-if="pulse"> · pulse</template>
      </template>

      <template #config>
        <DemoField label="图标 name">
          <span class="demo-form-label">{{ current }}</span>
        </DemoField>

        <DemoField label="尺寸 size" :value="`${ICON_SIZE_PX[size]}px`">
          <NeumorphismSegmented v-model="size" :options="sizeOptions" size="small" />
        </DemoField>

        <DemoField label="色调 tone">
          <NeumorphismSegmented v-model="tone" :options="toneOptions" size="small" />
        </DemoField>

        <DemoField label="线宽">
          <NeumorphismSegmented v-model="stroke" :options="strokeOptions" size="small" />
        </DemoField>

        <DemoField label="状态">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="spin" size="small" />
              <span>spin</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="pulse" size="small" />
              <span>pulse</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
          <NeumorphismButton variant="pressed" size="small" @click="copySnippet()">
            {{ copied ? '已复制' : '复制片段' }}
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">图标全集 · {{ ICON_NAMES.length }} 个语义（点一格切换上方预览）</h4>
    <div class="icon-toolbar">
      <NeumorphismInput
        v-model="keyword"
        size="small"
        class="icon-search"
        placeholder="搜索语义名，如 arrow / file"
      />
      <span class="demo-hint">{{ filtered.length }} / {{ ICON_NAMES.length }}</span>
    </div>
    <div class="icon-wall">
      <button
        v-for="name in filtered"
        :key="name"
        type="button"
        class="icon-cell"
        :class="{ 'icon-cell--active': name === current }"
        :title="`<NeumorphismIcon name=&quot;${name}&quot; />`"
        @click="pick(name)"
      >
        <NeumorphismIcon :name="name" size="xl" />
        <span class="icon-cell__name">{{ name }}</span>
      </button>
    </div>
    <p v-if="!filtered.length" class="demo-hint">没有匹配的语义名。</p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">语义色调 tone（值全部来自主题令牌，深色主题自动跟随）</h4>
    <div class="icon-row">
      <div v-for="sample in toneSamples" :key="sample.tone" class="icon-tile">
        <NeumorphismIcon :name="sample.name" :tone="sample.tone" size="2xl" />
        <span class="icon-tile__label">{{ sample.tone }}</span>
        <code class="icon-tile__token">{{ sample.token }}</code>
      </div>
    </div>
    <p class="demo-hint">
      <code>inherit</code>（默认）直接用
      <code>currentColor</code>，跟随父元素颜色；产品专属语义（如「推理中」「子代理」）用
      <code>style="color: …"</code> 传自己的令牌，不必进库。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">尺寸七档（线宽按档自动：≤12 → 2.5 / ≥24 → 1.5 / 其余 2）</h4>
    <div class="icon-row">
      <div v-for="(px, key) in ICON_SIZE_PX" :key="key" class="icon-tile">
        <NeumorphismIcon name="folder" :size="key" />
        <span class="icon-tile__label">{{ key }}</span>
        <code class="icon-tile__token">{{ px }}px</code>
      </div>
    </div>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">线宽六档（同一 2xl 尺寸，只改 stroke-width）</h4>
    <div class="icon-row">
      <div
        v-for="width in [...ICON_STROKE_ALLOWED].sort((a, b) => a - b)"
        :key="width"
        class="icon-tile"
      >
        <NeumorphismIcon name="circle-info" size="2xl" :stroke-width="width" />
        <span class="icon-tile__label">{{ width }}</span>
        <code class="icon-tile__token">{{ width === 2 ? '标准' : '语义档' }}</code>
      </div>
    </div>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">动效：spin / pulse（prefers-reduced-motion 下自动停用）</h4>
    <div class="icon-row">
      <div class="icon-tile">
        <NeumorphismIcon name="refresh" size="2xl" spin />
        <span class="icon-tile__label">spin</span>
        <code class="icon-tile__token">加载中</code>
      </div>
      <div class="icon-tile">
        <NeumorphismIcon name="clock" size="2xl" pulse />
        <span class="icon-tile__label">pulse</span>
        <code class="icon-tile__token">等待 / 连接中</code>
      </div>
      <div class="icon-tile">
        <NeumorphismIcon name="sparkle" size="2xl" tone="accent" pulse />
        <span class="icon-tile__label">pulse + tone</span>
        <code class="icon-tile__token">可叠加</code>
      </div>
    </div>
  </div>
</template>
