<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

const ROWS_MIN = 2
const ROWS_MAX = 10
const COUNT_MIN = 0
const COUNT_MAX = 300
/** 组件缺省 rows=4：配置台也用 4 起手，这样代码片段里不会出现冗余的 :rows */
const DEFAULT_ROWS = 4

// ---- 配置台状态 ----
const content = ref('')
const rows = ref(DEFAULT_ROWS)
const maxlength = ref(0)
const showCount = ref(false)
const autoResize = ref(false)
const label = ref('')
const placeholder = ref('请输入内容...')
const disabled = ref(false)

/**
 * 0 = 不限，但**不能**直接把 0 传给 maxlength：原生 `maxlength="0"` 意味着一个字都输不进去。
 * 只有传 undefined 才会让属性整个不渲染。
 */
const maxlengthValue = computed(() => maxlength.value || undefined)

const countReadout = computed(() => (maxlength.value ? `${maxlength.value} 字` : '不限'))

function setShowCount(on: boolean) {
  showCount.value = on
  // 组件里计数块是 `v-if="showCount && maxlength"`：没有上限时开关打开也看不到任何东西，
  // 所以顺手补一个 200 字上限，让这个开关点下去立刻有反馈
  if (on && !maxlength.value) maxlength.value = 200
}

function reset() {
  content.value = ''
  rows.value = DEFAULT_ROWS
  maxlength.value = 0
  showCount.value = false
  autoResize.value = false
  label.value = ''
  placeholder.value = '请输入内容...'
  disabled.value = false
}

// ---- 后续演示块独立状态 ----
const projectDesc = ref('')
const fixedText = ref('固定 3 行：内容超出后出现滚动条。')
const autoText = ref('自适应高度：内容变多时容器跟着长高，变少时再收回来。')
const errorText = ref('')
const readonlyText = ref('这一段是只读内容，可以选中复制，但改不了。')

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = ['v-model="content"']
  if (label.value) attrs.push(`label="${label.value}"`)
  if (placeholder.value !== '请输入内容...') attrs.push(`placeholder="${placeholder.value}"`)
  if (rows.value !== DEFAULT_ROWS) attrs.push(`:rows="${rows.value}"`)
  if (maxlength.value) attrs.push(`:maxlength="${maxlength.value}"`)
  if (showCount.value) attrs.push('show-count')
  if (autoResize.value) attrs.push('auto-resize')
  if (disabled.value) attrs.push('disabled')

  // 0 不能被当成「不限」写进属性：原生 maxlength="0" 意味着一个字都输不进去，只有省略属性才是真不限
  const note: string[] = maxlength.value
    ? []
    : ['  <!-- 不传 maxlength 才是「不限」：写 :maxlength="0" 会禁止一切输入 -->']
  return `<NeumorphismTextarea ${attrs.join(' ')} />
${note.join('\n')}`.trimEnd()
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <div class="demo-form-width" style="width: 100%">
        <NeumorphismTextarea
          v-model="content"
          :rows="rows"
          :maxlength="maxlengthValue"
          :show-count="showCount"
          :auto-resize="autoResize"
          :label="label"
          :placeholder="placeholder"
          :disabled="disabled"
        />
      </div>

      <template #spec>
        rows=<b>{{ rows }}</b> · maxlength=<b>{{ maxlength || '不限' }}</b> · showCount=<b>{{
          showCount ? '开' : '关'
        }}</b>
        · autoResize=<b>{{ autoResize ? '开' : '关' }}</b> · 已输入=<b>{{ content.length }}</b>
        <template v-if="disabled"> · disabled</template>
      </template>

      <template #hint>
        计数块的条件是 <code>showCount &amp;&amp; maxlength</code>——没有上限就没有分母，自然不渲染。
        <code>autoResize</code> 打开后组件会摘掉原生拖拽手柄（<code>resize: none</code
        >）并在每次输入后量 <code>scrollHeight</code>，此时 <code>rows</code> 只决定空态的最小高度。
      </template>

      <template #config>
        <DemoField label="行数 rows" :value="`${rows} 行`" grow>
          <NeumorphismSlider
            v-model="rows"
            :min="ROWS_MIN"
            :max="ROWS_MAX"
            :step="1"
            size="small"
          />
        </DemoField>

        <DemoField label="上限 maxlength" :value="countReadout" grow>
          <NeumorphismSlider
            v-model="maxlength"
            :min="COUNT_MIN"
            :max="COUNT_MAX"
            :step="10"
            size="small"
          />
        </DemoField>

        <DemoField label="字数统计">
          <NeumorphismSwitch
            :model-value="showCount"
            size="small"
            @update:model-value="setShowCount"
          />
        </DemoField>

        <DemoField label="自适应 autoResize">
          <NeumorphismSwitch v-model="autoResize" size="small" />
        </DemoField>

        <DemoField label="标签 label" grow>
          <NeumorphismInput v-model="label" size="small" placeholder="留空则不渲染标签" />
        </DemoField>

        <DemoField label="占位文案" grow>
          <NeumorphismInput v-model="placeholder" size="small" placeholder="placeholder" />
        </DemoField>

        <DemoField label="禁用 disabled">
          <NeumorphismSwitch v-model="disabled" size="small" />
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
    <h4 class="demo-label">字数统计（原演示的「项目描述」写法）</h4>
    <div class="demo-form-width">
      <NeumorphismTextarea
        v-model="projectDesc"
        label="项目描述"
        placeholder="请描述您的项目..."
        :maxlength="200"
        :rows="3"
        :show-count="true"
      />
    </div>
    <p class="demo-hint">
      计数显示在右下角（<code>已输入 / 上限</code>），达到上限后原生 <code>maxlength</code>
      会直接拦住多余的输入——不做「超出变红」的软限制，因为多语言输入法下软限制容易吞字。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">固定行数 vs 自适应高度</h4>
    <div class="demo-row demo-form-width" style="align-items: flex-start; gap: 20px">
      <div style="flex: 1 1 180px; min-width: 0">
        <NeumorphismTextarea v-model="fixedText" :rows="3" label="固定 3 行" />
      </div>
      <div style="flex: 1 1 180px; min-width: 0">
        <NeumorphismTextarea v-model="autoText" :rows="3" auto-resize label="auto-resize" />
      </div>
    </div>
    <p class="demo-hint">
      自适应只跟着内容走：删字后同样会收回去。量高时组件会临时清空 placeholder——浏览器会把折行的
      placeholder 计入
      <code>scrollHeight</code>，不清空的话窄容器里的空文本域会先虚高成两行、输入一个字再缩回来。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">错误、禁用与只读</h4>
    <div class="demo-row demo-row--stacked demo-form-width" style="gap: 18px">
      <NeumorphismTextarea
        v-model="errorText"
        placeholder="错误状态"
        error="请填写项目描述（至少 20 字）"
        :rows="3"
      />
      <NeumorphismTextarea model-value="禁用的文本域" disabled :rows="2" />
      <NeumorphismTextarea v-model="readonlyText" readonly :rows="2" />
    </div>
    <p class="demo-hint">
      与 Input 一致：<code>error</code> 只换配色与提示语（仍可输入），<code>disabled</code>
      不可聚焦、不进表单，<code>readonly</code> 可选中复制但不接受修改。
    </p>
  </div>
</template>
