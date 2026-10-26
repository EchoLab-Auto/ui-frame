<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DemoPlayground, DemoField, DemoPresets, type DemoPreset } from '../../demo'

type SkeletonVariant = 'text' | 'circle' | 'rect'
type SkeletonAnimation = 'pulse' | 'wave' | 'none'

// ---- 配置台状态 ----
const variant = ref<SkeletonVariant>('text')
const animation = ref<SkeletonAnimation>('pulse')
const width = ref(320)
const height = ref(14)
const rows = ref(3)
/** 演示 2 的独立开关：切换「骨架屏 ↔ 已加载内容」 */
const loading = ref(true)

const variantOptions = [
  { label: '文本', value: 'text' },
  { label: '圆形', value: 'circle' },
  { label: '矩形', value: 'rect' },
]
const animationOptions = [
  { label: '呼吸', value: 'pulse' },
  { label: '波浪', value: 'wave' },
  { label: '关闭', value: 'none' },
]

/**
 * 三种形态的自然尺寸差一个数量级，切换时把滑块拉到该形态的常见值。
 *
 * 不这么做的话，用户会看到「圆形 320×14」这种既不像圆也不像线的怪东西，
 * 还会误以为是组件渲染错了。
 */
watch(variant, v => {
  if (v === 'circle') {
    width.value = 44
    height.value = 44
  } else if (v === 'rect') {
    width.value = 320
    height.value = 120
  } else {
    width.value = 320
    height.value = 14
  }
})

function reset() {
  variant.value = 'text'
  animation.value = 'pulse'
  width.value = 320
  height.value = 14
  rows.value = 3
  loading.value = true
}

// ---- 变体一览 ----
interface PresetRow {
  key: string
  variant: SkeletonVariant
  animation: SkeletonAnimation
}

const presetRows: PresetRow[] = (['text', 'circle', 'rect'] as const).flatMap(v =>
  (['pulse', 'wave'] as const).map(a => ({ key: `${v}-${a}`, variant: v, animation: a }))
)

const presets = computed<DemoPreset[]>(() =>
  presetRows.map(row => ({
    key: row.key,
    code: `variant="${row.variant}" animation="${row.animation}"`,
    active: row.variant === variant.value && row.animation === animation.value,
  }))
)

function applyPreset(key: string) {
  const row = presetRows.find(r => r.key === key)
  if (!row) return
  // 先赋 animation 再赋 variant：variant 的 watch 会重置宽高，动作顺序不影响结果
  animation.value = row.animation
  variant.value = row.variant
}

function rowOf(key: string): PresetRow {
  return presetRows.find(r => r.key === key)!
}

/** 格子里的预览尺寸：文本行取满格、圆形给 36px、矩形压在 44px 高 */
function presetSize(row: PresetRow): { width: string; height: number } {
  if (row.variant === 'circle') return { width: '36px', height: 36 }
  if (row.variant === 'rect') return { width: '100%', height: 44 }
  return { width: '100%', height: 14 }
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = []
  if (variant.value !== 'text') attrs.push(`variant="${variant.value}"`)
  if (animation.value !== 'pulse') attrs.push(`animation="${animation.value}"`)
  if (width.value !== 320) attrs.push(`:width="${width.value}"`)
  if (height.value !== 14) attrs.push(`:height="${height.value}"`)
  const attrText = attrs.map(a => ` ${a}`).join('')

  // 多行文本用 v-for；单行/圆形/矩形直接写一个
  if (variant.value === 'text' && rows.value > 1) {
    return `<NeumorphismSkeleton v-for="i in ${rows.value}" :key="i"${attrText} />`
  }
  return `<NeumorphismSkeleton${attrText} />`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :stage-switch="false" :snippet="snippet">
      <div class="demo-row demo-row--stacked" style="width: 100%">
        <template v-if="variant === 'text'">
          <NeumorphismSkeleton
            v-for="i in rows"
            :key="i"
            variant="text"
            :animation="animation"
            :width="width"
            :height="height"
          />
        </template>
        <NeumorphismSkeleton
          v-else
          :variant="variant"
          :animation="animation"
          :width="width"
          :height="height"
        />
      </div>

      <template #spec>
        variant=<b>{{ variant }}</b> · animation=<b>{{ animation }}</b> · width=<b>{{ width }}px</b>
        · height=<b>{{ height }}px</b>
        <template v-if="variant === 'text'">
          · rows=<b>{{ rows }}</b></template
        >
      </template>

      <template #hint>
        <code>pulse</code> 是整体明暗呼吸，<code>wave</code> 是两层高光扫过表面；
        <code>none</code> 保留占位但不动。多行文本除了 <code>v-for</code>，也可以直接用组件自带的
        <code>count</code>（渲染 N 条同样宽度）。
      </template>

      <template #config>
        <DemoField label="形态 variant">
          <NeumorphismSegmented v-model="variant" :options="variantOptions" size="small" />
        </DemoField>

        <DemoField label="动画 animation">
          <NeumorphismSegmented v-model="animation" :options="animationOptions" size="small" />
        </DemoField>

        <DemoField label="宽度 width" :value="`${width}px`" grow>
          <NeumorphismSlider v-model="width" :min="40" :max="400" :step="10" size="small" />
        </DemoField>

        <DemoField label="高度 height" :value="`${height}px`" grow>
          <NeumorphismSlider v-model="height" :min="8" :max="240" :step="2" size="small" />
        </DemoField>

        <DemoField label="行数 rows" :value="`${rows} 行`" grow>
          <!-- 只有 text 才是「多行」；圆形/矩形传 count 只会得到 N 个一模一样的块 -->
          <NeumorphismSlider
            v-model="rows"
            :min="1"
            :max="6"
            :step="1"
            :disabled="variant !== 'text'"
            size="small"
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
    <h4 class="demo-label">加载态 ↔ 内容（组合成一屏卡片）</h4>
    <div class="demo-row" style="margin-bottom: 14px">
      <NeumorphismButton size="small" @click="loading = !loading">
        {{ loading ? '隐藏骨架屏' : '显示骨架屏' }}
      </NeumorphismButton>
    </div>

    <div v-if="loading">
      <div class="demo-row" style="align-items: center; gap: 16px; margin-bottom: 16px">
        <NeumorphismSkeleton variant="circle" :width="44" :height="44" />
        <div style="flex: 1">
          <NeumorphismSkeleton variant="text" width="60%" />
          <NeumorphismSkeleton variant="text" width="40%" />
        </div>
      </div>
      <!-- 组件根节点是 v-for 片段（count 条），属性无法自动落到任何一个 span 上，
           所以外边距必须由宿主容器给：直接写 style 会静默失效 -->
      <div style="margin-bottom: 12px">
        <NeumorphismSkeleton variant="rect" :height="120" animation="wave" />
      </div>
      <!-- count 是 v-for 的语法糖：一次渲染 N 条等宽文本行 -->
      <NeumorphismSkeleton variant="text" :count="2" />
      <NeumorphismSkeleton variant="text" width="80%" />
    </div>

    <NeumorphismCard v-else :elevation="1" style="max-width: 480px">
      <p><strong>内容已加载！</strong></p>
      <p style="color: var(--nm-text-secondary); font-size: 13px">此内容替代了上方的骨架屏占位。</p>
    </NeumorphismCard>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">形态 × 动画一览（点击载入到上方配置台）</h4>
    <DemoPresets :items="presets" @pick="applyPreset">
      <template #default="{ item }">
        <!--
          固定 56px 高的预览框：骨架屏本身会随形态变高（矩形 120px），
          不锁高度的话六个格子的底边会参差不齐。
        -->
        <div
          style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 56px;
          "
        >
          <NeumorphismSkeleton
            :variant="rowOf(item.key).variant"
            :animation="rowOf(item.key).animation"
            :width="presetSize(rowOf(item.key)).width"
            :height="presetSize(rowOf(item.key)).height"
          />
        </div>
      </template>
    </DemoPresets>
  </div>
</template>
