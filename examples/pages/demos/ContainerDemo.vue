<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

// ---- 配置台状态 ----
const fluid = ref(false)
const noPadding = ref(false)

/**
 * 当前视口宽度。
 *
 * Container 的 max-width 来自**窗口级**媒体查询，与预览台宽度无关；不把这个读数
 * 露出来，看的人会以为「fixed 和 fluid 没区别」（在窄预览台里确实没区别）。
 */
const viewportWidth = ref(0)

/** 与 src/styles/mixins.scss 的 $nm-breakpoint-* 一一对应，改断点必须两处一起改 */
const breakpoints = [
  { min: 0, label: 'xs <576', maxWidth: '100%' },
  { min: 576, label: 'sm ≥576', maxWidth: '540px' },
  { min: 768, label: 'md ≥768', maxWidth: '720px' },
  { min: 992, label: 'lg ≥992', maxWidth: '960px' },
  { min: 1200, label: 'xl ≥1200', maxWidth: '1140px' },
  { min: 1400, label: 'xxl ≥1400', maxWidth: '1320px' },
]

const activeBreakpoint = computed(() => {
  let active = breakpoints[0]
  for (const bp of breakpoints) {
    if (viewportWidth.value >= bp.min) active = bp
  }
  return active
})

/** fluid 模式下 max-width 不生效，读数要跟着说真话 */
const effectiveMaxWidth = computed(() =>
  fluid.value ? '100%（fluid）' : activeBreakpoint.value.maxWidth
)

function syncViewport() {
  viewportWidth.value = window.innerWidth
}

onMounted(() => {
  syncViewport()
  window.addEventListener('resize', syncViewport)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewport)
})

function reset() {
  fluid.value = false
  noPadding.value = false
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = []
  // mode 默认 fixed、noPadding 默认 false —— 默认值都不写进片段
  if (fluid.value) attrs.push('mode="fluid"')
  if (noPadding.value) attrs.push('no-padding')
  const open = attrs.length ? `<NeumorphismContainer ${attrs.join(' ')}>` : '<NeumorphismContainer>'
  return [open, '  <p>内容自动居中，随断点变化最大宽度</p>', '</NeumorphismContainer>'].join('\n')
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（固定 / 流体 · 内边距）</h4>
    <DemoPlayground :snippet="snippet" :stage-switch="false">
      <!-- 虚线框是「视口代理」：容器边界贴着它长，才看得出内容居中与内边距 -->
      <div
        style="
          width: 100%;
          border: 1px dashed var(--nm-text-placeholder);
          border-radius: var(--nm-border-radius-md);
          overflow: hidden;
        "
      >
        <NeumorphismContainer :mode="fluid ? 'fluid' : 'fixed'" :no-padding="noPadding">
          <NeumorphismCard
            :elevation="0"
            style="text-align: center; padding: 28px; border-radius: 0"
          >
            <p style="margin: 0; color: var(--nm-text-secondary); font-size: 13px">
              内容自动居中，随断点变化最大宽度
            </p>
          </NeumorphismCard>
        </NeumorphismContainer>
      </div>

      <template #spec>
        mode=<b>{{ fluid ? 'fluid' : 'fixed' }}</b> · noPadding=<b>{{ noPadding }}</b> · 视口
        <b>{{ viewportWidth }}px</b> → max-width <b>{{ effectiveMaxWidth }}</b>
      </template>

      <template #hint>
        断点是窗口级媒体查询，max-width 跟<b>浏览器宽度</b>走、与预览台宽度无关——预览台只有几百
        px，fixed 与 fluid 在这里看起来一样是正常的，把浏览器拉宽或对照下表的命中行才看得出差别。
      </template>

      <template #config>
        <DemoField label="流体 fluid" :value="fluid ? 'fluid' : 'fixed'">
          <label class="demo-toggle">
            <NeumorphismSwitch v-model="fluid" size="small" />
            <span>固定 ↔ 流体</span>
          </label>
        </DemoField>

        <DemoField label="内边距 noPadding" :value="String(noPadding)">
          <label class="demo-toggle">
            <NeumorphismSwitch v-model="noPadding" size="small" />
            <span>移除内边距</span>
          </label>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">断点与最大宽度（fixed 模式）</h4>
    <div class="demo-row demo-row--stacked" style="gap: 2px">
      <div v-for="bp in breakpoints" :key="bp.label" class="demo-row" style="gap: 12px">
        <code style="min-width: 86px; font-size: 12px">{{ bp.label }}</code>
        <span style="font-size: 13px; color: var(--nm-text-secondary)">
          max-width: {{ bp.maxWidth }}
        </span>
        <span
          v-if="bp.min === activeBreakpoint.min"
          style="font-size: 12px; color: var(--nm-primary-color)"
        >
          ← 当前视口命中
        </span>
      </div>
    </div>
    <p class="demo-hint">
      表里只有 <code>max-width</code> 一条规则；<code>padding-inline</code> 在 ≥768px 时从
      <code>--nm-spacing-md</code> 换成 <code>--nm-spacing-lg</code>。<br />
      <code>mode="fluid"</code> 只丢掉 max-width，内边距与居中（<code>margin-inline: auto</code>）
      保留。
    </p>
  </div>
</template>
