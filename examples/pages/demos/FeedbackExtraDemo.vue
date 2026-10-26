<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'
// 只借类型：UploadFile 定义在 headless 的 useUpload 里，组件本身由全局注册提供
import type { UploadFile } from '../../../src/composables/useUpload'

type AlertType = 'info' | 'success' | 'warning' | 'error'
type DrawerPosition = 'left' | 'right'

// ---- 配置台状态 ----
const alertType = ref<AlertType>('info')
const alertMessage = ref('信息提示：文档已同步更新')
const accept = ref('')
const multiple = ref(false)
const demoUploadFiles = ref<UploadFile[]>([])

const alertTypeOptions: { label: string; value: AlertType }[] = [
  { label: '信息', value: 'info' },
  { label: '成功', value: 'success' },
  { label: '警告', value: 'warning' },
  { label: '错误', value: 'error' },
]

/**
 * accept 的三个常见取值。
 *
 * 空串代表「不限」，但**不能**把空串直接传给组件的 accept：空串会渲染成
 * `accept=""` 属性，虽然当前校验逻辑把空串当不限处理，语义上仍应走默认值，
 * 所以模板里统一用 `accept || undefined`。
 */
const acceptOptions = [
  { label: '不限', value: '' },
  { label: '图片', value: 'image/*' },
  { label: 'PDF', value: '.pdf' },
]

// ---- Alert 四种类型（原始四种文案原样保留） ----
const alertExamples: { type: AlertType; message: string }[] = [
  { type: 'info', message: '信息提示：文档已同步更新' },
  { type: 'success', message: '成功：级联配置已生效' },
  { type: 'warning', message: '警告：该操作需要确认' },
  { type: 'error', message: '错误：提交失败，请重试' },
]

/** Alert 关闭后 DOM 会被移除；换 key 强制重建，验证「可关闭」又不至于演示一次就没了 */
const alertKey = ref(0)

// ---- Drawer ----
const demoDrawerOpen = ref(false)
const drawerPosition = ref<DrawerPosition>('right')

function toggleDrawerPosition() {
  drawerPosition.value = drawerPosition.value === 'right' ? 'left' : 'right'
}

// ---- Upload 限制示例 ----
const limitedFiles = ref<UploadFile[]>([])
const exceedCount = ref(0)

/**
 * 只是把「被丢掉了几个」记下来做读数。
 *
 * 组件内部已经把 incoming 裁到 maxCount 再入列，所以这里**不要**再去动
 * `limitedFiles`——在 exceed 回调里改动 v-model 绑定的数组，会和 composable
 * 正在写的那份列表抢同一个引用。
 */
function handleExceed(count: number) {
  exceedCount.value = count
}

function reset() {
  alertType.value = 'info'
  alertMessage.value = '信息提示：文档已同步更新'
  accept.value = ''
  multiple.value = false
  demoUploadFiles.value = []
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const alertAttrs: string[] = []
  // info 是默认类型，按「默认不写」的约定省略
  if (alertType.value !== 'info') alertAttrs.push(`type="${alertType.value}"`)
  alertAttrs.push(`message="${alertMessage.value}"`)

  const uploadAttrs = ['v-model="files"', 'drag']
  if (accept.value) uploadAttrs.push(`accept="${accept.value}"`)
  if (multiple.value) uploadAttrs.push('multiple')

  return [
    `<NeumorphismAlert ${alertAttrs.join(' ')} />`,
    '',
    `<NeumorphismUpload ${uploadAttrs.join(' ')} />`,
  ].join('\n')
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（提示条 / 拖拽上传）</h4>
    <DemoPlayground :snippet="snippet" :stage-switch="false">
      <div style="width: 100%; display: flex; flex-direction: column; gap: 16px">
        <!-- 预览里的 alert 关掉 closable：点一次 × 就再也回不来，会卡住整个配置台 -->
        <NeumorphismAlert :type="alertType" :message="alertMessage" :closable="false" />

        <div style="max-width: 360px; align-self: center; width: 100%">
          <NeumorphismUpload
            v-model="demoUploadFiles"
            drag
            :accept="accept || undefined"
            :multiple="multiple"
          />
        </div>
      </div>

      <template #spec>
        type=<b>{{ alertType }}</b> · accept=<b>{{ accept || '不限' }}</b> · multiple=<b>{{
          multiple
        }}</b>
        · 待上传 <b>{{ demoUploadFiles.length }}</b> 个
      </template>

      <template #hint>
        <code>accept</code> 同时按 MIME 与扩展名匹配（<code>image/*</code>、<code>.pdf</code>）；
        <code>multiple=false</code> 时新选的文件会<b>替换</b>旧列表而不是追加。<br />
        预览里的提示条显式关掉了 <code>closable</code>——「可关闭」的完整演示在下一块。
      </template>

      <template #config>
        <DemoField label="类型 type">
          <NeumorphismSegmented v-model="alertType" :options="alertTypeOptions" size="small" />
        </DemoField>

        <DemoField label="文案 message">
          <NeumorphismInput v-model="alertMessage" size="small" placeholder="提示文案" />
        </DemoField>

        <DemoField label="accept">
          <NeumorphismSegmented v-model="accept" :options="acceptOptions" size="small" />
        </DemoField>

        <DemoField label="多选">
          <label class="demo-toggle">
            <NeumorphismSwitch v-model="multiple" size="small" />
            <span>multiple</span>
          </label>
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
    <h4 class="demo-label">Alert 四种类型</h4>
    <div :key="alertKey" style="display: flex; flex-direction: column; gap: 10px">
      <NeumorphismAlert
        v-for="item in alertExamples"
        :key="item.type"
        :type="item.type"
        :message="item.message"
      />
    </div>
    <div class="demo-row" style="margin-top: 12px">
      <NeumorphismButton variant="pressed" size="small" @click="alertKey++"
        >重新显示四条</NeumorphismButton
      >
    </div>
    <p class="demo-hint">
      <code>closable</code> 默认 <code>true</code>：点 × 后提示条淡出、DOM 移除并触发
      <code>close</code>，所以要「召回」只能靠父级换 key 重建。<br />
      <code>duration &gt; 0</code> 时还会到期自动关闭（默认 0 = 常驻）。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">Drawer 抽屉</h4>
    <div class="demo-row">
      <NeumorphismButton @click="demoDrawerOpen = true">打开抽屉</NeumorphismButton>
      <NeumorphismButton variant="pressed" size="small" @click="toggleDrawerPosition()">
        切到{{ drawerPosition === 'right' ? '左侧' : '右侧' }}
      </NeumorphismButton>
      <code style="font-size: 13px">position: {{ drawerPosition }}</code>
    </div>

    <NeumorphismDrawer v-model="demoDrawerOpen" title="详情面板" :position="drawerPosition">
      <div style="padding: 16px">
        <p>抽屉内容区域 —— 支持 Esc 关闭、遮罩点击关闭与焦点陷阱。</p>
      </div>
    </NeumorphismDrawer>

    <p class="demo-hint">
      打开后 <kbd>Tab</kbd> 会在抽屉内部循环（焦点陷阱）、背景滚动被锁；<code>maskClosable</code> /
      <code>closable</code> 都能单独关掉，<code>destroyOnClose</code>
      决定关闭后是否连同内容一起销毁。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">Upload 体积 / 数量限制</h4>
    <div class="demo-form-width">
      <NeumorphismUpload
        v-model="limitedFiles"
        drag
        accept="image/*"
        :max-size="200 * 1024"
        :max-count="2"
        @exceed="handleExceed"
      />
    </div>
    <p class="demo-hint">
      每个文件 ≤ <b>200 KB</b>、最多 <b>2 个</b>；超出数量的文件由组件裁掉，并通过
      <code>exceed</code> 回传「被丢掉几个」（本次 <b>{{ exceedCount }}</b> 个）。<br />
      体积超限走 <code>onSizeExceed</code>：文件仍会入列，由列表自己显示
      <code>status="error"</code> 的错误态。
    </p>
  </div>
</template>
