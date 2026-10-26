<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'
type TooltipTrigger = 'hover' | 'click' | 'focus'

interface DemoOption<T> {
  label: string
  value: T
}

// ---- 配置台状态 ----
const position = ref<TooltipPosition>('top')
const trigger = ref<TooltipTrigger>('hover')
/** 文本内容；留空则走 #content 富文本插槽（预览里给一份默认富文本兜底） */
const content = ref('上方提示')

const positionOptions: DemoOption<TooltipPosition>[] = [
  { label: '上', value: 'top' },
  { label: '下', value: 'bottom' },
  { label: '左', value: 'left' },
  { label: '右', value: 'right' },
]
const triggerOptions: DemoOption<TooltipTrigger>[] = [
  { label: '悬停', value: 'hover' },
  { label: '点击', value: 'click' },
  { label: '聚焦', value: 'focus' },
]

const triggerLabel: Record<TooltipTrigger, string> = {
  hover: '悬停查看',
  click: '点击查看',
  focus: '聚焦查看',
}

function reset() {
  position.value = 'top'
  trigger.value = 'hover'
  content.value = '上方提示'
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = []
  if (content.value) attrs.push(`content="${content.value}"`)
  // position 默认 top、trigger 默认 hover，非默认才写
  if (position.value !== 'top') attrs.push(`position="${position.value}"`)
  if (trigger.value !== 'hover') attrs.push(`trigger="${trigger.value}"`)
  const attrText = attrs.length ? ` ${attrs.join(' ')}` : ''
  // 内容留空时片段改用插槽写法，保证复制出去的东西真的能显示
  const slot = content.value
    ? ''
    : `
  <template #content><strong>富文本</strong> 内容</template>`
  return `<NeumorphismTooltip${attrText}>
  <NeumorphismButton>${triggerLabel[trigger.value]}</NeumorphismButton>${slot}
</NeumorphismTooltip>`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet" min-height="170px">
      <!-- 上下留白：气泡是 fixed 定位、贴在按钮正上/正下方，距预览台边缘太近时会压到
           spec 行与背景切换器，留 28px 让它有地方落 -->
      <div style="padding: 28px 0">
        <NeumorphismTooltip :content="content" :position="position" :trigger="trigger">
          <NeumorphismButton>{{ triggerLabel[trigger] }}</NeumorphismButton>
          <template v-if="!content" #content>
            <span>自定义<strong>富文本</strong>内容</span>
          </template>
        </NeumorphismTooltip>
      </div>

      <template #spec>
        position=<b>{{ position }}</b> · trigger=<b>{{ trigger }}</b> · content=<b>{{
          content || '（#content 插槽）'
        }}</b>
      </template>

      <template #hint>
        气泡 teleport 到 <code>body</code> 并逐帧跟随触发器，所以不会被祖先的
        <code>overflow</code> 裁掉；贴近视口边缘时会自动翻转方向。
        <code>focus</code> 触发要求触发器本身可聚焦（这里用的是真实按钮）。
      </template>

      <template #config>
        <DemoField label="内容 content" grow>
          <NeumorphismInput v-model="content" size="small" placeholder="留空则用 #content 插槽" />
        </DemoField>

        <DemoField label="方向 position">
          <NeumorphismSegmented v-model="position" :options="positionOptions" size="small" />
        </DemoField>

        <DemoField label="触发 trigger">
          <NeumorphismSegmented v-model="trigger" :options="triggerOptions" size="small" />
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()">
            恢复默认
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">四方向 / 点击触发 / 富文本插槽</h4>
    <div class="demo-row" style="padding: 28px 0; gap: 16px">
      <NeumorphismTooltip content="上方提示" position="top">
        <NeumorphismButton variant="pressed" size="small">悬停（上）</NeumorphismButton>
      </NeumorphismTooltip>
      <NeumorphismTooltip content="下方提示" position="bottom">
        <NeumorphismButton variant="pressed" size="small">悬停（下）</NeumorphismButton>
      </NeumorphismTooltip>
      <NeumorphismTooltip content="左侧提示" position="left">
        <NeumorphismButton variant="pressed" size="small">悬停（左）</NeumorphismButton>
      </NeumorphismTooltip>
      <NeumorphismTooltip content="右侧提示" position="right">
        <NeumorphismButton variant="pressed" size="small">悬停（右）</NeumorphismButton>
      </NeumorphismTooltip>
      <NeumorphismTooltip position="top" trigger="click">
        <NeumorphismButton size="small">点击触发</NeumorphismButton>
        <template #content>
          <span>自定义<strong>富文本</strong>内容</span>
        </template>
      </NeumorphismTooltip>
      <NeumorphismTooltip content="聚焦时出现，Tab 离开即消失" trigger="focus" position="bottom">
        <NeumorphismButton size="small">聚焦触发</NeumorphismButton>
      </NeumorphismTooltip>
    </div>
    <p class="demo-hint">
      纯文本用 <code>content</code> 属性即可；要加粗、换行、放图标时改用 <code>#content</code>
      插槽——两者同时存在时插槽优先。
    </p>
  </div>
</template>
