<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

/**
 * 只声明本页用到的规则字段。结构与库里的 `FormRule` 一致，
 * 但为一个演示文件去 import `src/components/**` 的类型没有必要。
 */
interface DemoRule {
  required?: boolean
  minLength?: number
  pattern?: RegExp
  message?: string
}

/** ToastProvider 暴露的最小结构：够调用即可，避免为了类型把组件 import 进来 */
interface ToastApi {
  addToast?: (options: { message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void
}

// ---- 表单状态 ----
const formModel = ref({
  username: '',
  email: '',
  password: '',
})
/** 组件实例 ref：只需要 clearErrors，用最小结构类型即可，不引入组件本身 */
const formRef = ref<{ clearErrors?: () => void }>()
const toastRef = ref<ToastApi>()

// ---- 配置台状态 ----
const ruleRequired = ref(true)
const ruleMinLength = ref(true)
const rulePattern = ref(true)
// 88 落在滑块 60 + 4k 的刻度上，初始状态拇指不会停在两根刻度之间
const labelWidth = ref(88)

/**
 * 规则由三个开关拼装而成：关掉某一类规则，表单上立刻只校验剩下的部分。
 * 每次开关变化都会得到新的对象——`NeumorphismForm` 内部用 getter 读 props，
 * 所以替换整个对象能实时生效。
 */
const formRules = computed<Record<string, DemoRule[]>>(() => ({
  username: [
    ...(ruleRequired.value ? [{ required: true, message: '请输入用户名' }] : []),
    ...(ruleMinLength.value ? [{ minLength: 3, message: '至少 3 个字符' }] : []),
  ],
  email: [
    ...(ruleRequired.value ? [{ required: true, message: '请输入邮箱' }] : []),
    ...(rulePattern.value
      ? [{ pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' }]
      : []),
  ],
  password: [
    ...(ruleRequired.value ? [{ required: true, message: '请输入密码' }] : []),
    ...(ruleMinLength.value ? [{ minLength: 6, message: '至少 6 个字符' }] : []),
  ],
}))

// 规则一改，屏幕上残留的错误文案可能已经不成立 —— 先清掉，改动后再提交即可重新校验
watch([ruleRequired, ruleMinLength, rulePattern], () => {
  formRef.value?.clearErrors?.()
})

const activeRules = computed(() => {
  const enabled: string[] = []
  if (ruleRequired.value) enabled.push('必填')
  if (ruleMinLength.value) enabled.push('最小长度')
  if (rulePattern.value) enabled.push('邮箱正则')
  return enabled.length ? enabled.join(' + ') : '无'
})

// ---- 提交 / 清除 ----
const submittedJson = ref('')

function handleFormSubmit(model: Record<string, unknown>) {
  submittedJson.value = JSON.stringify(model)
  toastRef.value?.addToast?.({ type: 'success', message: '校验通过，表单已提交' })
}

function clearErrors() {
  formRef.value?.clearErrors?.()
}

function resetForm() {
  formModel.value = { username: '', email: '', password: '' }
  submittedJson.value = ''
  formRef.value?.clearErrors?.()
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const required = ruleRequired.value ? ' required' : ''
  const ruleNote =
    activeRules.value === '无' ? '当前未启用任何规则' : `当前已启用规则：${activeRules.value}`
  return `<!-- ${ruleNote} -->
<NeumorphismForm
  ref="formRef"
  :model="formModel"
  :rules="formRules"
  label-width="${labelWidth.value}px"
  @submit="onSubmit"
>
  <NeumorphismFormItem label="用户名" name="username"${required} :rules="formRules.username">
    <NeumorphismInput v-model="formModel.username" placeholder="至少 3 个字符" />
  </NeumorphismFormItem>
  <NeumorphismFormItem label="邮箱" name="email"${required} :rules="formRules.email">
    <NeumorphismInput v-model="formModel.email" placeholder="例如 user@example.com" />
  </NeumorphismFormItem>
  <NeumorphismFormItem label="密码" name="password"${required} :rules="formRules.password">
    <NeumorphismInput v-model="formModel.password" type="password" placeholder="至少 6 个字符" />
  </NeumorphismFormItem>
  <NeumorphismButton type="submit" variant="raised">提交</NeumorphismButton>
</NeumorphismForm>`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <div style="width: min(420px, 100%)">
        <NeumorphismForm
          ref="formRef"
          :model="formModel"
          :rules="formRules"
          :label-width="`${labelWidth}px`"
          @submit="handleFormSubmit"
        >
          <NeumorphismFormItem
            label="用户名"
            name="username"
            :required="ruleRequired"
            :rules="formRules.username"
          >
            <NeumorphismInput v-model="formModel.username" placeholder="至少 3 个字符" />
          </NeumorphismFormItem>

          <NeumorphismFormItem
            label="邮箱"
            name="email"
            :required="ruleRequired"
            :rules="formRules.email"
          >
            <NeumorphismInput v-model="formModel.email" placeholder="例如 user@example.com" />
          </NeumorphismFormItem>

          <NeumorphismFormItem
            label="密码"
            name="password"
            :required="ruleRequired"
            :rules="formRules.password"
          >
            <NeumorphismInput
              v-model="formModel.password"
              type="password"
              placeholder="至少 6 个字符"
            />
          </NeumorphismFormItem>

          <div class="demo-row" style="margin-top: 12px">
            <NeumorphismButton type="submit" variant="raised">提交</NeumorphismButton>
            <NeumorphismButton type="button" variant="pressed" @click="clearErrors()"
              >清除错误</NeumorphismButton
            >
          </div>
        </NeumorphismForm>
      </div>

      <template #spec>
        必填=<b>{{ ruleRequired ? '开' : '关' }}</b> · 最小长度=<b>{{
          ruleMinLength ? '开' : '关'
        }}</b>
        · 邮箱正则=<b>{{ rulePattern ? '开' : '关' }}</b> · labelWidth=<b>{{ labelWidth }}px</b>
      </template>

      <template #hint>
        点「提交」触发整表校验：空字段/格式错误会在对应 <code>FormItem</code> 下方以
        <code>role="alert"</code> 展示。
        「清除错误」只清错误状态、不改数据；规则开关改动后会立即清空旧错误。
        <code>labelWidth</code> 是标签盒宽度，<code>vertical</code>
        布局下标签独占一行，只有横向布局才对得齐标签列。
      </template>

      <template #config>
        <DemoField label="标签宽 labelWidth" :value="`${labelWidth}px`" label-width="128px" grow>
          <NeumorphismSlider v-model="labelWidth" :min="60" :max="160" :step="4" size="small" />
        </DemoField>

        <DemoField label="必填 required" label-width="128px">
          <NeumorphismSwitch v-model="ruleRequired" size="small" />
        </DemoField>

        <DemoField label="最小长度 minLength" label-width="128px">
          <NeumorphismSwitch v-model="ruleMinLength" size="small" />
        </DemoField>

        <DemoField label="邮箱正则 pattern" label-width="128px">
          <NeumorphismSwitch v-model="rulePattern" size="small" />
        </DemoField>

        <DemoField label="操作" label-width="128px">
          <div class="demo-row" style="gap: 8px">
            <NeumorphismButton variant="raised" size="small" @click="resetForm()"
              >重置表单</NeumorphismButton
            >
            <NeumorphismButton variant="pressed" size="small" @click="clearErrors()"
              >清除错误</NeumorphismButton
            >
          </div>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
  <!-- 演示自己的 toast 容器：原页面是全局单例，拆卡后每张演示卡自带一份 -->
  <NeumorphismToastProvider ref="toastRef" position="top-right" />
</template>
