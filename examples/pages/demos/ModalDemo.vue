<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type ModalSize = 'small' | 'medium' | 'large'
type ModalEvent = 'open' | 'confirm' | 'cancel' | 'close'

interface DemoOption<T> {
  label: string
  value: T
}

// ---- 配置台状态 ----
const title = ref('示例模态框')
const size = ref<ModalSize>('small')
/** 点遮罩关闭：组件里 maskClosable 与 closable 是「与」关系，任一为 false 都关不掉 */
const maskClosable = ref(true)
/**
 * 页脚：'default' 用内置两颗按钮，'slot' 用 `#footer` 插槽接管，
 * 'none' 传 `:footer="false"` 关掉（只剩右上角关闭与 Esc 两条退出路径）。
 */
const footerMode = ref<'default' | 'slot' | 'none'>('default')
const footer = computed(() => footerMode.value !== 'none')
const confirmLabel = ref('确认')
const cancelLabel = ref('取消')

const visible = ref(false)
/** 模态框里那个输入框的值：只用来证明焦点被锁在弹层内，Esc 收起后原值仍在 */
const modalText = ref('')

const sizeOptions: DemoOption<ModalSize>[] = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]

/**
 * 事件回显。
 *
 * confirm 之后的动作序列固定是 confirm → close（handleConfirm 先 emit 再关），
 * 只留「最后一个事件」会永远只看到 close，所以按时间顺序留 4 条，
 * 用 "open → confirm → close" 把整条链路摊开。
 */
const eventLog = ref<string[]>([])

function note(event: ModalEvent) {
  eventLog.value = [...eventLog.value, event].slice(-4)
}

const eventText = computed(() => (eventLog.value.length ? eventLog.value.join(' → ') : '—'))

function reset() {
  title.value = '示例模态框'
  size.value = 'small'
  maskClosable.value = true
  footerMode.value = 'default'
  confirmLabel.value = '确认'
  cancelLabel.value = '取消'
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = ['v-model="visible"']
  // title 没有默认值（不传就不渲染标题栏标题），所以有值才写
  if (title.value) attrs.push(`title="${title.value}"`)
  // size 默认 medium；maskClosable / footer 默认 true，只在关掉时补属性
  if (size.value !== 'medium') attrs.push(`size="${size.value}"`)
  if (!maskClosable.value) attrs.push(':mask-closable="false"')
  // 'slot' 时不写 footer 属性，页脚由插槽接管
  if (footerMode.value === 'none') attrs.push(':footer="false"')
  if (confirmLabel.value !== '确认') attrs.push(`confirm-label="${confirmLabel.value}"`)
  if (cancelLabel.value !== '取消') attrs.push(`cancel-label="${cancelLabel.value}"`)
  const slotFooter =
    footerMode.value === 'slot'
      ? `
  <template #footer>
    <NeumorphismButton variant="pressed" size="small">稍后</NeumorphismButton>
    <NeumorphismButton variant="primary" size="small">保存并关闭</NeumorphismButton>
  </template>`
      : ''
  return `<NeumorphismModal ${attrs.join(' ')} @confirm="onConfirm" @cancel="onCancel">
  <p>正文内容</p>${slotFooter}
</NeumorphismModal>`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet" min-height="180px">
      <NeumorphismButton @click="visible = true">打开模态框</NeumorphismButton>

      <p class="demo-hint" style="margin: 0">
        最近事件：<strong>{{ eventText }}</strong>
      </p>

      <template #spec>
        size=<b>{{ size }}</b> · title=<b>{{ title || '（无标题）' }}</b> · maskClosable=<b>{{
          maskClosable
        }}</b>
        · footer=<b>{{ footerMode }}</b>
      </template>

      <template #hint>
        <code>Esc</code> 关闭、焦点锁在弹层内、背景模糊；<code>mask-closable</code> 为
        <code>false</code> 时点遮罩不关。<code>confirm</code> 会先派发事件再自动关闭，
        <code>cancel</code> 覆盖「取消按钮 / 关闭按钮 / 点遮罩」三条路径。
      </template>

      <template #config>
        <DemoField label="标题 title" grow>
          <NeumorphismInput v-model="title" size="small" placeholder="留空则不渲染标题" />
        </DemoField>

        <DemoField label="尺寸 size">
          <NeumorphismSegmented v-model="size" :options="sizeOptions" size="small" />
        </DemoField>

        <DemoField label="确认文案">
          <NeumorphismInput v-model="confirmLabel" size="small" placeholder="确认" />
        </DemoField>

        <DemoField label="取消文案">
          <NeumorphismInput v-model="cancelLabel" size="small" placeholder="取消" />
        </DemoField>

        <DemoField label="页脚 footer">
          <NeumorphismSegmented
            v-model="footerMode"
            :options="[
              { label: '内置', value: 'default' },
              { label: '#footer 插槽', value: 'slot' },
              { label: '关闭', value: 'none' },
            ]"
            size="small"
          />
        </DemoField>

        <DemoField label="行为">
          <label class="demo-toggle">
            <NeumorphismSwitch v-model="maskClosable" size="small" />
            <span>maskClosable（与 closable 是与关系）</span>
          </label>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()">
            恢复默认
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>

    <NeumorphismModal
      v-model="visible"
      :title="title"
      :size="size"
      :mask-closable="maskClosable"
      :footer="footer"
      :confirm-label="confirmLabel"
      :cancel-label="cancelLabel"
      @open="note('open')"
      @confirm="note('confirm')"
      @cancel="note('cancel')"
      @close="note('close')"
    >
      <p>这是一个新拟态风格的模态对话框。</p>
      <p style="color: var(--nm-text-secondary); font-size: 13px">
        它支持焦点锁定、按 Esc 键关闭和背景模糊效果。
      </p>
      <div style="margin-top: 12px">
        <NeumorphismInput v-model="modalText" placeholder="在模态框中输入内容..." />
      </div>
      <template v-if="footerMode === 'slot'" #footer>
        <NeumorphismButton variant="pressed" size="small" @click="note('cancel')">
          稍后
        </NeumorphismButton>
        <NeumorphismButton variant="primary" size="small" @click="note('confirm')">
          保存并关闭
        </NeumorphismButton>
      </template>
    </NeumorphismModal>
  </div>
</template>
