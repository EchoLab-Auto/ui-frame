<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField, type DemoStage } from '../../demo'
import { ChatComposer, type ChatComposerFocusEffect } from '../../../src/composites/chat'

/** 玻璃档位：none 是本演示的控制台档位，传给组件时归一为 false */
type GlassLevel = 'float' | 'raised' | 'pressed'
type ComposerGlass = 'none' | GlassLevel

// ---- 配置台状态 ----
const composerValue = ref('')
/** 最近一次 send / cancel 的回显内容（事件契约的可见证据） */
const composerEvent = ref('')
const composerGlass = ref<ComposerGlass>('raised')
const composerFocusEffect = ref<ChatComposerFocusEffect>('glow')
const composerCancelable = ref(true)
/** 玻璃是半透明材质，默认落在彩色台面上才看得出磨砂 */
const composerStage = ref<DemoStage>('gradient')

const composerGlassOptions = [
  { label: '关闭', value: 'none' },
  { label: '悬浮', value: 'float' },
  { label: '凸面', value: 'raised' },
  { label: '凹陷', value: 'pressed' },
]
const composerFocusOptions = [
  { label: '外环', value: 'ring' },
  { label: '内辉光', value: 'glow' },
  { label: '深凹陷', value: 'inset' },
  { label: '无', value: 'none' },
]

/**
 * 传给组件的 glass：'none' 必须显式给 false。
 * 组件里 `undefined` 会回落到全局配置，只有 `false` 才是"明确不要玻璃"。
 */
const composerGlassValue = computed<false | GlassLevel>(() =>
  composerGlass.value === 'none' ? false : composerGlass.value
)

/** `@send` 拿到的是 trim 后的非空字符串；真实聊天里发完就清空输入 */
function onSend(content: string) {
  composerEvent.value = `send → ${content}`
  composerValue.value = ''
}

function onCancel() {
  composerEvent.value = 'cancel →（已请求取消任务）'
}

function reset() {
  composerValue.value = ''
  composerEvent.value = ''
  composerGlass.value = 'raised'
  composerFocusEffect.value = 'glow'
  composerCancelable.value = true
  composerStage.value = 'gradient'
}

// ---- 玻璃档位一览：同一段文字在四档材质下的样子 ----
const glassLadder: { key: string; label: string; glass: false | GlassLevel }[] = [
  { key: 'none', label: '关闭', glass: false },
  { key: 'float', label: '悬浮 float', glass: 'float' },
  { key: 'raised', label: '凸面 raised', glass: 'raised' },
  { key: 'pressed', label: '凹陷 pressed', glass: 'pressed' },
]
/** 四档各有自己的输入内容，否则四个 v-model 共享一串文字，一敲全变 */
const ladderValues = ref<Record<string, string>>({ none: '', float: '', raised: '', pressed: '' })

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = ['v-model="value"']
  if (composerGlass.value !== 'none') attrs.push(`glass="${composerGlass.value}"`)
  if (composerFocusEffect.value !== 'ring')
    attrs.push(`focus-effect="${composerFocusEffect.value}"`)
  if (composerCancelable.value) attrs.push('cancelable')
  const open = `<ChatComposer ${attrs.join(' ')} @send="onSend" @cancel="onCancel">`
  const meta = `\n  <template #meta>
    glass=${composerGlass.value} · focusEffect=${composerFocusEffect.value}
  </template>`
  return `${open}${meta}\n</ChatComposer>`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">玻璃托盘 + 聚焦特效（点进输入框看效果）</h4>
    <DemoPlayground v-model:stage="composerStage" :snippet="snippet">
      <!-- 不再套 .composer-stage：DemoPlayground 本身就是那块彩色台面，
           两层的渐变叠在一起只会渲染出一圈同色圆角，看不出任何层次 -->
      <div style="width: 100%">
        <ChatComposer
          v-model="composerValue"
          :glass="composerGlassValue"
          :focus-effect="composerFocusEffect"
          :cancelable="composerCancelable"
          placeholder="试试点进来，看看内辉光 / 外环 / 深凹陷的差别"
          @send="onSend"
          @cancel="onCancel"
        >
          <template #meta>
            <span
              >glass=<b>{{ composerGlass }}</b> · focusEffect=<b>{{ composerFocusEffect }}</b></span
            >
          </template>
        </ChatComposer>
      </div>

      <template #spec>
        glass=<b>{{ composerGlass }}</b> · focusEffect=<b>{{ composerFocusEffect }}</b> ·
        cancelable=<b>{{ composerCancelable }}</b>
        <template v-if="composerEvent">
          · 最近事件 <b>{{ composerEvent }}</b></template
        >
      </template>

      <template #hint>
        材质挂在<strong>外壳</strong>上（浮起的玻璃托盘），内部输入槽保持凹陷——层次是「玻璃托盘 ›
        凹陷输入槽」。四档聚焦特效：<code>ring</code> 外侧主色光环（历史默认）、 <code>glow</code>
        <strong>内辉光</strong>（主色光从凹槽内部亮起，玻璃模式下托盘一并被点亮）、
        <code>inset</code> 纯加深凹陷（无彩色）、<code>none</code> 交给宿主。
        玻璃需在彩色背景上才看得到磨砂；键入 <kbd>Enter</kbd> 发送、<kbd>Shift</kbd>+<kbd
          >Enter</kbd
        >
        换行，IME 组字中不误发。
      </template>

      <template #config>
        <DemoField label="玻璃 glass">
          <NeumorphismSegmented
            v-model="composerGlass"
            :options="composerGlassOptions"
            size="small"
          />
        </DemoField>

        <DemoField label="聚焦特效" label-width="88px">
          <NeumorphismSegmented
            v-model="composerFocusEffect"
            :options="composerFocusOptions"
            size="small"
          />
        </DemoField>

        <DemoField label="取消按钮">
          <label class="demo-toggle">
            <NeumorphismSwitch v-model="composerCancelable" size="small" />
            <span>cancelable</span>
          </label>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
          <NeumorphismButton variant="pressed" size="small" @click="composerStage = 'gradient'">
            切彩色台面
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">四档玻璃并排（同一段文字，彩色台面）</h4>
    <div class="demo-row" style="gap: 16px; align-items: stretch">
      <div v-for="item in glassLadder" :key="item.key" style="flex: 1 1 280px; min-width: 260px">
        <h4 class="demo-label">{{ item.label }}</h4>
        <div class="composer-stage composer-stage--gradient">
          <ChatComposer
            v-model="ladderValues[item.key]"
            :glass="item.glass"
            focus-effect="glow"
            :rows="2"
            :placeholder="`glass=${item.key}`"
          />
        </div>
      </div>
    </div>
    <p class="demo-hint">
      玻璃只换<strong>表面材质</strong>（半透明底 + 模糊 + 高光边），阴影方向仍由档位决定：
      <code>float</code> 环境投影、<code>raised</code> 凸起双阴影、<code>pressed</code> 凹陷内阴影。
      玻璃托盘上的输入槽依旧是凹陷的——两层材质叠在一起才有"悬浮玻璃里嵌了块凹槽"的层次。
    </p>
  </div>
</template>
