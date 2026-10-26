<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField, DemoPresets, type DemoPreset } from '../../demo'

type LogoMode = 'pulse' | 'liquid' | 'wave' | 'pointer'

// ---- 配置台状态 ----
const logoMode = ref<LogoMode>('pulse')
const logoWidth = ref(220)
const logoGoo = ref(true)
const logoFloating = ref(true)

const logoModeOptions: { label: string; value: LogoMode }[] = [
  { label: '脉冲传导', value: 'pulse' },
  { label: '液态律动', value: 'liquid' },
  { label: '潮汐波纹', value: 'wave' },
  { label: '指针引力', value: 'pointer' },
]

/** 当前模式的中文名：配置台、按钮组、提示文字共用一份，避免文案漂移 */
const logoModeLabel = computed(
  () => logoModeOptions.find(option => option.value === logoMode.value)?.label ?? '脉冲传导'
)

function modeOf(key: string): LogoMode {
  return logoModeOptions.find(option => option.value === key)?.value ?? 'pulse'
}

// ---- 模式一览：四格各跑一种动画，点击载入到上方配置台 ----
const logoPresets = computed<DemoPreset[]>(() =>
  logoModeOptions.map(option => ({
    key: option.value,
    code: `mode="${option.value}"`,
    active: logoMode.value === option.value,
  }))
)

function applyLogoPreset(key: string) {
  logoMode.value = modeOf(key)
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = ['v-model:mode="mode"', `:width="${logoWidth.value}"`]
  // goo / floating 组件默认都是 true，只有关掉时才需要显式写出来
  if (!logoGoo.value) attrs.push(':goo="false"')
  if (!logoFloating.value) attrs.push(':floating="false"')
  const open = `<NeumorphismLogo ${attrs.join(' ')}>`
  const slot = `
  <template #default="{ replay }">
    <NeumorphismButton size="small" @click="replay">↻ 重播汇聚</NeumorphismButton>
  </template>
</NeumorphismLogo>`
  return `${open}${slot}`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <!--
        原卡片是「凸起卡片里嵌凹陷面板」；这里的直接父级（预览台）本身就是凹陷槽，
        所以面板改成凸起（elevation=1），台阶方向才对——Logo 的光晕落在抬高的平面上。
      -->
      <NeumorphismCard
        :elevation="1"
        style="padding: 24px; display: inline-block; text-align: center"
      >
        <NeumorphismLogo
          v-model:mode="logoMode"
          :width="logoWidth"
          :goo="logoGoo"
          :floating="logoFloating"
        >
          <template #default="{ replay }">
            <div style="margin-top: 12px">
              <NeumorphismButton size="small" @click="replay">↻ 重播汇聚</NeumorphismButton>
            </div>
          </template>
        </NeumorphismLogo>
      </NeumorphismCard>

      <template #spec>
        mode=<b>{{ logoMode }}</b> · width=<b>{{ logoWidth }}px</b> · goo=<b>{{ logoGoo }}</b> ·
        floating=<b>{{ logoFloating }}</b>
      </template>

      <template #hint>
        当前模式：<strong>{{ logoModeLabel }}</strong
        >。选择「指针引力」后将鼠标移入 Logo，方块会跟随光标移动。
        <code>goo</code> 是黏液滤镜：像素块靠 <code>feGaussianBlur</code> +
        <code>feColorMatrix</code> 的 alpha 对比在视觉上融成一片，关掉就是一颗颗独立方块。
      </template>

      <template #config>
        <DemoField label="模式 mode">
          <NeumorphismSegmented v-model="logoMode" :options="logoModeOptions" size="small" />
        </DemoField>

        <DemoField label="宽度 width" :value="`${logoWidth}px`" grow>
          <NeumorphismSlider v-model="logoWidth" :min="80" :max="360" :step="10" size="small" />
        </DemoField>

        <DemoField label="滤镜">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="logoGoo" size="small" />
              <span>goo</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="logoFloating" size="small" />
              <span>floating</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="logoMode = 'pulse'"
            >回到脉冲</NeumorphismButton
          >
          <NeumorphismButton variant="pressed" size="small" @click="logoGoo = !logoGoo">
            切换 goo
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">模式切换（与配置台同一份状态）</h4>
    <div class="demo-row" style="gap: 10px; flex-wrap: wrap">
      <NeumorphismButton
        v-for="opt in logoModeOptions"
        :key="opt.value"
        size="small"
        :variant="logoMode === opt.value ? 'pressed' : 'raised'"
        @click="logoMode = opt.value"
      >
        {{ opt.label }}
      </NeumorphismButton>
    </div>

    <h4 class="demo-label" style="margin-top: 18px">四种模式一览（点击载入到上方预览）</h4>
    <DemoPresets :items="logoPresets" @pick="applyLogoPreset">
      <template #default="{ item }">
        <NeumorphismLogo :mode="modeOf(item.key)" :width="88" :goo="logoGoo" :floating="false" />
      </template>
    </DemoPresets>

    <p class="demo-hint" style="margin-top: 10px">
      当前模式：<strong>{{ logoModeLabel }}</strong
      >。动画全部由 <code>usePixelLogoAnimation</code> 在 <code>requestAnimationFrame</code> 里驱动
      ——组件本身不持有时序状态，切模式只换参数曲线；系统打开
      <code>prefers-reduced-motion</code> 时动画幅度会被压到接近静态。
    </p>
  </div>
</template>
