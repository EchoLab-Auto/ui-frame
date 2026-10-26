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
/** 内置页脚（取消 / 确认）。关掉后只剩关闭按钮与 Esc 两条退出路径 */
const footer = ref(true)
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

// ---- 自定义页脚（第 2 个 block）----
const slotVisible = ref(false)
const slotSaved = ref(false)

function confirmSlot() {
  slotSaved.value = true
  slotVisible.value = false
}

function cancelSlot() {
  slotSaved.value = false
  slotVisible.value = false
}

function reset() {
  title.value = '示例模态框'
  size.value = 'small'
  maskClosable.value = true
  footer.value = true
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
  if (!footer.value) attrs.push(':footer="false"')
  if (confirmLabel.value !== '确认') attrs.push(`confirm-label="${confirmLabel.value}"`)
  if (cancelLabel.value !== '取消') attrs.push(`cancel-label="${cancelLabel.value}"`)
  return `<NeumorphismModal ${attrs.join(' ')} @confirm="onConfirm" @cancel="onCancel">
  <p>正文内容</p>
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
        · footer=<b>{{ footer }}</b>
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

        <DemoField label="行为">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="maskClosable" size="small" />
              <span>maskClosable</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="footer" size="small" />
              <span>footer</span>
            </label>
          </div>
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
    </NeumorphismModal>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">自定义页脚（#footer 插槽）</h4>
    <NeumorphismButton size="small" @click="slotVisible = true"
      >打开自定义页脚模态框</NeumorphismButton
    >
    <p class="demo-hint">
      页脚内容完全由插槽接管：这里放「稍后」和主按钮两颗不同变体的按钮。 最近结果：<strong>{{
        slotSaved ? '已确认' : '未操作'
      }}</strong>
    </p>

    <NeumorphismModal v-model="slotVisible" title="自定义页脚" size="medium">
      <p>需要把「保存并继续」做成主按钮时，直接用 <code>#footer</code> 插槽换掉内置那两颗。</p>
      <p style="color: var(--nm-text-secondary); font-size: 13px">
        内置页脚的确认/取消文案仍可由 <code>confirm-label</code> / <code>cancel-label</code>
        覆盖；插槽一旦提供，两颗内置按钮就不渲染了。
      </p>
      <template #footer>
        <NeumorphismButton variant="pressed" size="small" @click="cancelSlot()">
          稍后
        </NeumorphismButton>
        <NeumorphismButton variant="primary" size="small" @click="confirmSlot()">
          保存并关闭
        </NeumorphismButton>
      </template>
    </NeumorphismModal>
  </div>
</template>
