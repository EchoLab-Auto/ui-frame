<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

/**
 * 尺寸只有一个量：**最小高度 px**。
 *
 * 2026-11 起 `size` 直接收 px（数字 size 的语义就是最小高度），组件按锚点表
 * （36 / 48 / 60）分段插值算出内边距与字号并写进 `--nm-field-sz-*`——所以老演示里
 * 「按当前档位手动写 `--nm-field-min-height-sm|md|lg`」的那套 `previewStyle` 桥接
 * 整体删掉：数字路径不挂档位类，桥接选择器本来也命中不到。
 */
const HEIGHT_MIN = 32
const HEIGHT_MAX = 72
const DEFAULT_HEIGHT = 48

// ---- 配置台状态 ----
const value = ref('')
const height = ref(DEFAULT_HEIGHT)
/** 别名：模板与片段里沿用 `size` 这个名字 */
const size = height
const label = ref('')
const placeholder = ref('请输入内容')
const errorOn = ref(false)
const errorText = ref('请输入有效的邮箱地址')
const disabled = ref(false)
const readonly = ref(false)
const affix = ref(false)

/** 常用高度（原三档锚点 36 / 48 / 60）当快捷取值 */
const sizeOptions = [
  { label: '36', value: 36 },
  { label: '48', value: 48 },
  { label: '60', value: 60 },
]

/**
 * error 支持 string | boolean 两种写法：
 * 有文案 → 红框 + 文案；开关打开但文案清空 → `true`，只染色不出文案。
 * 关闭时必须传 false（而不是 undefined）——undefined 会被 `!!error` 判成无错，
 * 但显式的 false 让「用户关掉了错误」这件事在代码里也是清楚的。
 */
const errorValue = computed<string | boolean>(() => {
  if (!errorOn.value) return false
  return errorText.value || true
})

function pickSize(next: string | number) {
  height.value = Number(next)
}

function reset() {
  value.value = ''
  height.value = DEFAULT_HEIGHT
  label.value = ''
  placeholder.value = '请输入内容'
  errorOn.value = false
  errorText.value = '请输入有效的邮箱地址'
  disabled.value = false
  readonly.value = false
  affix.value = false
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = ['v-model="value"']
  if (size.value !== DEFAULT_HEIGHT) attrs.push(`:size="${size.value}"`)
  if (label.value) attrs.push(`label="${label.value}"`)
  if (placeholder.value !== '请输入内容') attrs.push(`placeholder="${placeholder.value}"`)
  // error 的布尔写法必须写成 :error="true"：裸写 error 时 prop 类型是 [String, Boolean]，
  // 空串会按 String 解析成 ''（假值），红框根本不会出现
  if (errorOn.value) attrs.push(errorText.value ? `error="${errorText.value}"` : ':error="true"')
  if (disabled.value) attrs.push('disabled')
  if (readonly.value) attrs.push('readonly')

  const slots: string[] = []
  if (affix.value) {
    slots.push('  <template #prefix>\n    <NeumorphismIcon name="search" />\n  </template>')
    slots.push('  <template #suffix>\n    <NeumorphismIcon name="check" />\n  </template>')
  }

  const open = `<NeumorphismInput ${attrs.join(' ')}`
  const body = slots.length ? `${open}>\n${slots.join('\n')}\n</NeumorphismInput>` : `${open} />`
  return body
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <div class="demo-form-width" style="width: 100%">
        <NeumorphismInput
          v-model="value"
          :size="size"
          :label="label"
          :placeholder="placeholder"
          :error="errorValue"
          :disabled="disabled"
          :readonly="readonly"
        >
          <template v-if="affix" #prefix>
            <NeumorphismIcon name="search" />
          </template>
          <template v-if="affix" #suffix>
            <NeumorphismIcon name="check" />
          </template>
        </NeumorphismInput>
      </div>

      <template #spec>
        size=<b>{{ size }}px</b> · error=<b>{{
          errorOn ? (errorText ? '文案' : '布尔') : '关闭'
        }}</b>
        · 插槽=<b>{{ affix ? 'prefix + suffix' : '无' }}</b>
        <template v-if="disabled"> · disabled</template>
        <template v-if="readonly"> · readonly</template>
      </template>

      <template #hint>
        高度不是 prop：Input 的尺寸完全由 <code>--nm-field-min-height / padding / font-*</code> 这组
        token 驱动，所以滑块写的是「当前档位」对应那组变量（<code>-sm</code> / <code>-md</code> /
        <code>-lg</code>），换档时高度会回到该档位的基准值。<br />
        <code>error</code> 传字符串出文案、传 <code>true</code> 只染红框。
      </template>

      <template #config>
        <DemoField label="尺寸 size">
          <NeumorphismSegmented
            :model-value="size"
            :options="sizeOptions"
            :size="26"
            @update:model-value="pickSize"
          />
        </DemoField>

        <DemoField label="高度 height" :value="`${height}px`" grow>
          <NeumorphismSlider
            v-model="height"
            :min="HEIGHT_MIN"
            :max="HEIGHT_MAX"
            :step="2"
            :size="6"
          />
        </DemoField>

        <DemoField label="标签 label" grow>
          <NeumorphismInput v-model="label" :size="36" placeholder="留空则不渲染标签" />
        </DemoField>

        <DemoField label="占位文案" grow>
          <NeumorphismInput v-model="placeholder" :size="36" placeholder="placeholder" />
        </DemoField>

        <DemoField label="错误 error">
          <NeumorphismSwitch v-model="errorOn" :size="24" />
          <span class="demo-form-label">{{
            errorOn ? (errorText ? '字符串 error' : '布尔 error') : '关闭'
          }}</span>
        </DemoField>

        <DemoField label="错误文案" grow>
          <NeumorphismInput v-model="errorText" :size="36" placeholder="留空 = 只染红框" />
        </DemoField>

        <DemoField label="状态">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="disabled" :size="24" />
              <span>disabled</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="readonly" :size="24" />
              <span>readonly</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="前缀/后缀">
          <label class="demo-toggle">
            <NeumorphismSwitch v-model="affix" :size="24" />
            <span>#prefix + #suffix</span>
          </label>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" :size="32" @click="reset()"
            >恢复默认</NeumorphismButton
          >
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
