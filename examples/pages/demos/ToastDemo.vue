<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type ToastKind = 'info' | 'success' | 'warning' | 'error'
type ToastPosition =
  'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

interface DemoOption<T> {
  label: string
  value: T
}

/**
 * provider 的暴露面（defineExpose: addToast / removeToast / clearAll / toasts）。
 *
 * 这里只写演示真正用到的两个方法——用最小结构描述 ref，比 `any` 安全，
 * 也不用把 src 里的类型搬到示例里来。
 */
interface ToastHandle {
  addToast: (options: {
    message: string
    type: ToastKind
    duration?: number
    closable?: boolean
  }) => string
  clearAll: () => void
}

// ---- 配置台状态 ----
const position = ref<ToastPosition>('top-right')
/** 同屏上限：超出后最早的一条被挤掉（不是排队），调小最容易观察到 */
const maxCount = ref(5)
/** 单条存活时长；写 0 才是常驻（addToast 内部 `if (duration > 0)` 才挂定时器） */
const duration = ref(3000)

const toastContainer = ref<ToastHandle>()
/** 消息编号：不加这个，连点同一个类型的三条消息长得一模一样，看不出是新发的 */
let toastCounter = 0
const lastMessage = ref('—')

const positionOptions: DemoOption<ToastPosition>[] = [
  { label: '左上', value: 'top-left' },
  { label: '上中', value: 'top-center' },
  { label: '右上', value: 'top-right' },
  { label: '左下', value: 'bottom-left' },
  { label: '下中', value: 'bottom-center' },
  { label: '右下', value: 'bottom-right' },
]

const positionLabel: Record<ToastPosition, string> = {
  'top-left': '左上',
  'top-center': '上中',
  'top-right': '右上',
  'bottom-left': '左下',
  'bottom-center': '下中',
  'bottom-right': '右下',
}

function showToast(type: ToastKind, message?: string) {
  toastCounter += 1
  const text = message ?? `${type} 通知 #${toastCounter} — 新拟态设计真漂亮！`
  lastMessage.value = text
  toastContainer.value?.addToast({ message: text, type, duration: duration.value })
}

/** 一次发 4 条：用来看 maxCount 上限与堆叠方向 */
function showBurst() {
  const kinds: ToastKind[] = ['info', 'success', 'warning', 'error']
  kinds.forEach(kind => showToast(kind))
}

/** 常驻一条：duration 传 0，只能靠右上角关闭按钮或 Esc 收掉 */
function showSticky() {
  lastMessage.value = '常驻通知（duration: 0）'
  toastContainer.value?.addToast({
    message: '常驻通知：我不会自动消失',
    type: 'warning',
    duration: 0,
    closable: true,
  })
}

function clearAll() {
  toastContainer.value?.clearAll()
  lastMessage.value = '已清空'
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = ['ref="toastContainer"']
  // provider 默认 top-right / maxCount 5（与 examples/main.ts 的全局配置一致），非默认才写
  if (position.value !== 'top-right') attrs.push(`position="${position.value}"`)
  if (maxCount.value !== 5) attrs.push(`:max-count="${maxCount.value}"`)
  return `<NeumorphismToastProvider ${attrs.join(' ')} />
<!-- 触发（组件 ref 上取 addToast）：
     toastContainer.value?.addToast({ message: '成功', type: 'success', duration: ${duration.value} }) -->`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet" min-height="170px">
      <div class="demo-row" style="justify-content: center">
        <NeumorphismButton @click="showToast('info')">信息</NeumorphismButton>
        <NeumorphismButton @click="showToast('success')">成功</NeumorphismButton>
        <NeumorphismButton @click="showToast('warning')">警告</NeumorphismButton>
        <NeumorphismButton @click="showToast('error')">错误</NeumorphismButton>
      </div>

      <p class="demo-hint" style="margin: 0">
        最近一条：<strong>{{ lastMessage }}</strong>
      </p>

      <template #spec>
        position=<b>{{ positionLabel[position] }}（{{ position }}）</b> · maxCount=<b>{{
          maxCount
        }}</b>
        · duration=<b>{{ duration }}ms</b>
      </template>

      <template #hint>
        通知 teleport 到 <code>body</code>、固定在视口边缘，所以它不会出现在预览台里——
        点上面的按钮看屏幕对应的角。
      </template>

      <template #config>
        <DemoField label="位置 position" grow>
          <NeumorphismSelect v-model="position" :options="positionOptions" size="small" />
        </DemoField>

        <DemoField label="上限 maxCount" :value="String(maxCount)" grow>
          <NeumorphismSlider v-model="maxCount" :min="1" :max="8" :step="1" size="small" />
        </DemoField>

        <DemoField label="时长 duration" :value="`${duration}ms`" grow>
          <NeumorphismSlider v-model="duration" :min="1000" :max="6000" :step="500" size="small" />
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="showBurst()">
            连发 4 条
          </NeumorphismButton>
          <NeumorphismButton variant="pressed" size="small" @click="clearAll()">
            清空
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>

    <!-- provider 只渲染 teleport，放在卡片里即可；ref 上拿到 addToast / clearAll -->
    <NeumorphismToastProvider ref="toastContainer" :position="position" :max-count="maxCount" />
  </div>
  <div class="demo-block">
    <h4 class="demo-label">堆叠上限 / 常驻通知 / 清空</h4>
    <div class="demo-row">
      <NeumorphismButton variant="raised" size="small" @click="showBurst()">
        连发 4 条（看 maxCount 挤掉最早的）
      </NeumorphismButton>
      <NeumorphismButton variant="pressed" size="small" @click="showSticky()">
        duration: 0（常驻）
      </NeumorphismButton>
      <NeumorphismButton variant="pressed" size="small" @click="clearAll()">
        clearAll()
      </NeumorphismButton>
    </div>
    <p class="demo-hint">
      <code>maxCount</code> 是硬上限：第 n+1 条入队时丢掉最早的一条，不会排队等待。 每条都带
      <code>closable</code>，也可按 <code>Esc</code> 逐条从新到旧关闭。
    </p>
  </div>
</template>
