<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField, DemoPresets, type DemoPreset } from '../../demo'

// ---- 配置台状态 ----
const labelText = ref('用户名')
const required = ref(true)
const forId = ref('demo-field-input')
const errorMessage = ref('该字段为必填项，请输入至少 2 个字符')
const inputError = ref(true)
const inputValue = ref('')

function reset() {
  labelText.value = '用户名'
  required.value = true
  forId.value = 'demo-field-input'
  errorMessage.value = '该字段为必填项，请输入至少 2 个字符'
  inputError.value = true
  inputValue.value = ''
}

// ---- 组合一览 ----
interface PresetRow extends DemoPreset {
  label: string
  required: boolean
  error: boolean
  message: string
}

const presetRows: PresetRow[] = [
  {
    key: 'required-error',
    code: 'required + error',
    label: '用户名',
    required: true,
    error: true,
    message: '该字段为必填项',
  },
  {
    key: 'required-only',
    code: 'required',
    label: '用户名',
    required: true,
    error: false,
    message: '',
  },
  {
    key: 'optional-error',
    code: 'error="…"',
    label: '邮箱',
    required: false,
    error: true,
    message: '邮箱格式不正确',
  },
  {
    key: 'plain',
    code: 'label="备注"',
    label: '备注',
    required: false,
    error: false,
    message: '',
  },
]

const presets = computed<DemoPreset[]>(() =>
  presetRows.map(row => ({
    key: row.key,
    code: row.code,
    // 文案不算「变体」：只比对星号与错误态，改文案不会让选中态丢失
    active:
      row.label === labelText.value &&
      row.required === required.value &&
      row.error === inputError.value,
  }))
)

function applyPreset(key: string) {
  const row = presetRows.find(item => item.key === key)
  if (!row) return
  labelText.value = row.label
  required.value = row.required
  inputError.value = row.error
  errorMessage.value = row.message
}

function rowOf(key: string) {
  return presetRows.find(item => item.key === key)!
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const id = forId.value.trim()
  const lines: string[] = []

  if (labelText.value.trim()) {
    const attrs = [`label="${labelText.value.trim()}"`]
    if (required.value) attrs.push('required')
    // for-id 与输入框 id 必须成对出现，否则标签点不动输入框
    if (id) attrs.push(`for-id="${id}"`)
    lines.push(`<NeumorphismFieldLabel ${attrs.join(' ')} />`)
  }

  const inputAttrs: string[] = []
  if (id) inputAttrs.push(`id="${id}"`)
  inputAttrs.push('v-model="value"', 'placeholder="请输入用户名"')
  // 布尔 error 只上红框，不渲染文案（文案交给下面的 FieldError）
  if (inputError.value) inputAttrs.push('error')
  lines.push(`<NeumorphismInput ${inputAttrs.join(' ')} />`)

  const message = errorMessage.value.trim()
  if (message) {
    const attrs: string[] = []
    if (id) attrs.push(`id="${id}-error"`)
    attrs.push(`message="${message}"`)
    lines.push(`<NeumorphismFieldError ${attrs.join(' ')} />`)
  }

  return lines.join('\n')
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <div style="width: min(320px, 100%); display: flex; flex-direction: column">
        <!-- 标签与输入框是「手工组装」的，间距得自己给；输入框内置标签用的是 --nm-spacing-sm -->
        <NeumorphismFieldLabel
          :label="labelText"
          :required="required"
          :for-id="forId.trim() || undefined"
          style="margin-bottom: var(--nm-spacing-sm)"
        />
        <!--
          Input 的 id 由 useFormField 在 setup 时快照一次，运行期改 id 不会自己更新，
          所以用 key 强制重建，保证「标签 for-id ↔ 输入框 id」始终是同一刻的值。
        -->
        <NeumorphismInput
          :id="forId.trim() || undefined"
          :key="forId.trim()"
          v-model="inputValue"
          placeholder="请输入用户名"
          :error="inputError"
        />
        <!-- 输入框传布尔 error 时自己不会渲染文案，文案交给这个 role=alert 的辅助组件 -->
        <NeumorphismFieldError
          :id="forId.trim() ? `${forId.trim()}-error` : undefined"
          :message="errorMessage"
        />
      </div>

      <template #spec>
        label=<b>{{ labelText || '（不渲染）' }}</b> · required=<b>{{ required ? '开' : '关' }}</b>
        · error=<b>{{ inputError ? '开' : '关' }}</b> · for-id=<b>{{ forId || '（无）' }}</b>
      </template>

      <template #hint>
        点标签文字试试：只有 <code>for-id</code> 与输入框的
        <code>id</code>
        指到同一个值时才会聚焦输入框。清空标签文案或错误文案，对应元素会整块消失（组件内部是
        <code>v-if</code>）。
      </template>

      <template #config>
        <DemoField label="标签文本">
          <NeumorphismInput v-model="labelText" size="small" placeholder="留空则不渲染标签" />
        </DemoField>

        <DemoField label="关联 for-id" label-width="98px">
          <NeumorphismInput v-model="forId" size="small" placeholder="留空则取消关联" />
        </DemoField>

        <DemoField label="错误文案">
          <NeumorphismInput v-model="errorMessage" size="small" placeholder="留空则不渲染错误" />
        </DemoField>

        <DemoField label="状态">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="required" size="small" />
              <span>required</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="inputError" size="small" />
              <span>输入框 error</span>
            </label>
          </div>
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
    <h4 class="demo-label">组合一览：required 星号 × role=alert 错误提示（点击载入到上方）</h4>
    <DemoPresets :items="presets" @pick="applyPreset">
      <template #default="{ item }">
        <div style="width: 100%; text-align: left">
          <NeumorphismFieldLabel
            :label="rowOf(item.key).label"
            :required="rowOf(item.key).required"
          />
          <NeumorphismInput
            placeholder="请输入"
            size="small"
            :error="rowOf(item.key).error"
            style="margin-top: 4px"
          />
          <NeumorphismFieldError :message="rowOf(item.key).message" />
        </div>
      </template>
    </DemoPresets>
    <p class="demo-hint" style="margin-top: 10px">
      <code>NeumorphismFieldLabel</code> 只是带星号的 <code>&lt;label&gt;</code>，
      <code>NeumorphismFieldError</code> 只是带 <code>role="alert"</code> 的错误行 ——
      两个组件都不持有校验逻辑，校验状态由输入类组件或 <code>FormItem</code> 传进来。
    </p>
  </div>
</template>
