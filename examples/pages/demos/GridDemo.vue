<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

// ---- 配置台状态 ----
const gutter = ref(12)
const span = ref(8)
const offset = ref(0)

/**
 * 预览固定 3 列。
 *
 * 列的**数量**不随 span 变：span 是主体，offset 挂在最后一列上，正好复现
 * 「col-8 + col-8 offset-8」这类真实写法；列数跟着变反而看不出偏移的效果。
 */
const previewCols = [1, 2, 3]

/** 3 列 span 加上偏移的总格数；超过 24 最后一列必然换行，读数里直接说清楚 */
const totalUnits = computed(() => span.value * previewCols.length + offset.value)

function cellLabel(index: number) {
  const parts = [`col-${span.value}`]
  if (index === previewCols.length && offset.value > 0) parts.push(`offset-${offset.value}`)
  return parts.join(' ')
}

function reset() {
  gutter.value = 12
  span.value = 8
  offset.value = 0
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const cols = previewCols.map(index => {
    const offsetAttr =
      index === previewCols.length && offset.value > 0 ? ` :offset="${offset.value}"` : ''
    return `  <NeumorphismCol :span="${span.value}"${offsetAttr}>${cellLabel(index)}</NeumorphismCol>`
  })
  // gutter 默认 0，按「默认不写」的约定省略
  const rowOpen =
    gutter.value > 0 ? `<NeumorphismRow :gutter="${gutter.value}">` : '<NeumorphismRow>'
  return [rowOpen, ...cols, '</NeumorphismRow>'].join('\n')
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（gutter / span / offset）</h4>
    <DemoPlayground :snippet="snippet" :stage-switch="false">
      <!-- 预览台是 align-items:center 的列向 flex，Row 若直接当孩子会缩成内容宽；
           套一层 width:100% 才能让 24 栅格按整行宽度铺开 -->
      <div style="width: 100%">
        <NeumorphismRow :gutter="gutter">
          <NeumorphismCol
            v-for="n in previewCols"
            :key="n"
            :span="span"
            :offset="n === previewCols.length ? offset : undefined"
          >
            <NeumorphismCard :elevation="1">
              <div class="grid-cell">{{ cellLabel(n) }}</div>
            </NeumorphismCard>
          </NeumorphismCol>
        </NeumorphismRow>
      </div>

      <template #spec>
        gutter=<b>{{ gutter }}</b> · span=<b>{{ span }}</b> · offset=<b>{{ offset }}</b> · 总格数
        <b>{{ totalUnits }}/24</b>
        <template v-if="totalUnits > 24">（超出 → 最后一列换行）</template>
      </template>

      <template #hint>
        <code>gutter</code> 由 Row 通过 provide 下发，Col 只负责把 <code>gutter/2</code> 写成左右
        padding——所以栅格间距<b>不会</b>撑破 24 格宽度；<code>offset</code> 是
        <code>margin-left</code>，会被算进换行判断。
      </template>

      <template #config>
        <DemoField label="间距 gutter" :value="`${gutter}px`" grow>
          <NeumorphismSlider v-model="gutter" :min="0" :max="32" :step="1" size="small" />
        </DemoField>

        <DemoField label="占位 span" :value="`${span}/24`" grow>
          <NeumorphismSlider v-model="span" :min="1" :max="24" :step="1" size="small" />
        </DemoField>

        <DemoField label="偏移 offset" :value="`${offset}`" grow>
          <NeumorphismSlider v-model="offset" :min="0" :max="12" :step="1" size="small" />
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
    <h4 class="demo-label">响应式栅格（调整浏览器宽度查看效果）</h4>
    <NeumorphismRow :gutter="12">
      <NeumorphismCol v-for="n in 4" :key="n" :xs="24" :sm="12" :md="8" :lg="6">
        <NeumorphismCard :elevation="1">
          <div class="grid-cell">手机:24 / 平板:8 / 桌面:6</div>
        </NeumorphismCard>
      </NeumorphismCol>
    </NeumorphismRow>
    <p class="demo-hint">
      断点为 mobile-first（min-width）：<code>xs 0</code> · <code>sm 576</code> ·
      <code>md 768</code> · <code>lg 992</code> · <code>xl 1200</code> · <code>xxl 1400</code>；
      未写的断点<b>继承更小的那一档</b>，所以这里 <code>xs=24</code> 一路管到 576px 才被
      <code>sm=12</code> 覆盖。
    </p>
  </div>
</template>
