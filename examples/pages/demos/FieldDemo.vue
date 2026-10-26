<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

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
</template>
