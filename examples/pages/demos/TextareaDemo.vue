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
const readonly = ref(false)
/** 空串 = 无错误。组件按 `!!error` 判态，所以空串天然等于「关闭」 */
const errorMsg = ref('')

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
  readonly.value = false
  errorMsg.value = ''
}

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
  if (readonly.value) attrs.push('readonly')
  if (errorMsg.value) attrs.push(`error="${errorMsg.value}"`)

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
          :readonly="readonly"
          :error="errorMsg"
        />
      </div>

      <template #spec>
        rows=<b>{{ rows }}</b> · maxlength=<b>{{ maxlength || '不限' }}</b> · showCount=<b>{{
          showCount ? '开' : '关'
        }}</b>
        · autoResize=<b>{{ autoResize ? '开' : '关' }}</b> · 已输入=<b>{{ content.length }}</b>
        <template v-if="disabled"> · disabled</template>
        <template v-if="readonly"> · readonly</template>
        <template v-if="errorMsg"> · error</template>
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

        <DemoField label="只读 readonly">
          <NeumorphismSwitch v-model="readonly" size="small" />
        </DemoField>

        <DemoField label="错误文案 error" grow>
          <NeumorphismInput v-model="errorMsg" size="small" placeholder="留空则不报错" />
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
