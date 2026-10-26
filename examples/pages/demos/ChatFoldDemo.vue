<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'
import { ChatFold, ChatCopyButton } from '../../../src/composites/chat'

type FoldTone = 'sunk' | 'raised'

// ---- 配置台状态 ----
/** 井面：凹陷详情井（组件默认）或凸起卡片 */
const foldTone = ref<FoldTone>('sunk')
/** 非受控初始展开态。ChatFold 只在挂载时读 `defaultOpen`，所以下面靠 :key 重挂载（见模板注释） */
const foldDefaultOpen = ref(false)
const foldHeadText = ref('工具详情')
const foldShowSubhead = ref(false)
const foldShowActions = ref(true)
/** 最近一次 toggle 的方向——`#head` 的作用域插槽只给得出当前态，历史动作得由宿主记 */
const foldLastToggle = ref('')

const foldToneOptions = [
  { label: '凹陷', value: 'sunk' },
  { label: '凸起', value: 'raised' },
]

function onFoldToggle(open: boolean) {
  foldLastToggle.value = open ? '展开' : '收起'
}

function reset() {
  foldTone.value = 'sunk'
  foldDefaultOpen.value = false
  foldHeadText.value = '工具详情'
  foldShowSubhead.value = false
  foldShowActions.value = true
  foldLastToggle.value = ''
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = []
  if (foldTone.value === 'raised') attrs.push(':sunk="false"')
  if (foldDefaultOpen.value) attrs.push('default-open')
  const open = attrs.length ? `<ChatFold ${attrs.join(' ')}>` : '<ChatFold>'
  // `#head` 的 { open } 是展开态来源：触发器文案/图标状态都该由它派生，而不是另存一份布尔
  const head = `\n  <template #head="{ open }">
    {{ open ? '收起' : '展开' }}${foldHeadText.value}
  </template>`
  const subhead = foldShowSubhead.value
    ? '\n  <template #subhead>摘要区（subhead）始终可见，不受折叠影响</template>'
    : ''
  const actions = foldShowActions.value
    ? '\n  <template #actions><ChatCopyButton text="分支结果内容" /></template>'
    : ''
  const body = '\n  折叠体内容：参数、输出，或任意 DOM。\n</ChatFold>'
  return `${open}${head}${subhead}${actions}${body}`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet" :stage-switch="false">
      <!--
        `defaultOpen` 是非受控初始值，组件只在 setup 时读一次；要让它变成"可调参数"，
        必须用 key 把实例换掉。受控场景请改用 v-model:open。
      -->
      <ChatFold
        :key="`fold-${foldDefaultOpen}`"
        :sunk="foldTone === 'sunk'"
        :default-open="foldDefaultOpen"
        style="width: 100%; max-width: 520px"
        @toggle="onFoldToggle"
      >
        <template #head="{ open }">
          <span style="font-size: var(--nm-font-sm)">{{ foldHeadText || '折叠块' }}</span>
          <span
            style="
              margin-left: auto;
              font-size: var(--nm-font-xs);
              color: var(--nm-text-placeholder);
            "
          >
            {{ open ? '已展开' : '已收起' }}
          </span>
        </template>

        <template v-if="foldShowSubhead" #subhead>
          <p style="margin: 0; font-size: var(--nm-font-sm)">
            摘要区（subhead）始终可见，不受折叠影响。
          </p>
        </template>

        <template v-if="foldShowActions" #actions>
          <ChatCopyButton text="分支结果内容" />
        </template>

        <p style="margin: 0; font-size: var(--nm-font-sm); color: var(--nm-text-secondary)">
          折叠体内容：参数、输出，或任意 DOM。
        </p>
      </ChatFold>

      <template #spec>
        sunk=<b>{{ foldTone === 'sunk' }}</b> · defaultOpen=<b>{{ foldDefaultOpen }}</b> ·
        subhead=<b>{{ foldShowSubhead }}</b> · actions=<b>{{ foldShowActions }}</b>
        <template v-if="foldLastToggle">
          · 最近<b>{{ foldLastToggle }}</b></template
        >
      </template>

      <template #hint>
        <code>sunk</code> 是井面语义：凹陷（默认）用于「详情井」，凸起用于独立卡片。
        <code>actions</code> 与触发器平级、不嵌进按钮里——里面有按钮时嵌套按钮是无效 HTML。
      </template>

      <template #config>
        <DemoField label="head 文案">
          <NeumorphismInput v-model="foldHeadText" size="small" placeholder="工具详情" />
        </DemoField>

        <DemoField label="井面 sunk">
          <NeumorphismSegmented v-model="foldTone" :options="foldToneOptions" size="small" />
        </DemoField>

        <DemoField label="初始展开">
          <label class="demo-toggle">
            <NeumorphismSwitch v-model="foldDefaultOpen" size="small" />
            <span>defaultOpen</span>
          </label>
        </DemoField>

        <DemoField label="插槽">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="foldShowSubhead" size="small" />
              <span>subhead</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="foldShowActions" size="small" />
              <span>actions</span>
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
    <h4 class="demo-label">三种用法并排：凹陷详情井 · 凸起卡片 · 静态行</h4>
    <div class="demo-row" style="gap: 24px; align-items: flex-start">
      <div style="flex: 1 1 260px; min-width: 260px">
        <h4 class="demo-label">凹陷详情井</h4>
        <div style="display: flex; flex-direction: column; gap: 12px">
          <ChatFold>
            <template #head="{ open }">
              <span style="font-size: var(--nm-font-sm)">
                {{ open ? '收起工具详情' : '展开工具详情' }}
              </span>
            </template>
            <p style="margin: 0; font-size: var(--nm-font-sm); color: var(--nm-text-secondary)">
              折叠体内容：参数、输出，或任意 DOM。
            </p>
          </ChatFold>
          <ChatFold default-open>
            <template #head>
              <span style="font-size: var(--nm-font-sm)">推理过程（默认展开）</span>
            </template>
            <p style="margin: 0; font-size: var(--nm-font-sm); color: var(--nm-text-secondary)">
              先分析输入，再组织输出。
            </p>
          </ChatFold>
        </div>
      </div>

      <div style="flex: 1 1 260px; min-width: 260px">
        <h4 class="demo-label">凸起卡片 + subhead 常显 + actions</h4>
        <ChatFold :sunk="false">
          <template #head="{ open }">
            <strong style="font-size: var(--nm-font-sm)">分支合并</strong>
            <span
              style="
                margin-left: auto;
                font-size: var(--nm-font-xs);
                color: var(--nm-text-placeholder);
              "
            >
              {{ open ? '收起' : '2 工具 · 1 推理' }}
            </span>
          </template>
          <template #actions>
            <ChatCopyButton text="分支结果内容" />
          </template>
          <template #subhead>
            <p style="margin: 0; font-size: var(--nm-font-sm)">
              摘要区（subhead）始终可见，不受折叠影响。
            </p>
          </template>
          <p style="margin: 0; font-size: var(--nm-font-sm); color: var(--nm-text-secondary)">
            折叠体：分支内的详细活动记录。actions 插槽的复制按钮独立于触发器。
          </p>
        </ChatFold>
      </div>

      <div style="flex: 1 1 260px; min-width: 260px">
        <h4 class="demo-label">静态行（expandable=false）</h4>
        <ChatFold :sunk="false" :expandable="false">
          <template #head>
            <span style="font-size: var(--nm-font-sm)">工具调用 · 已完成</span>
          </template>
          <template #actions>
            <ChatCopyButton text="工具调用摘要" />
          </template>
        </ChatFold>
      </div>
    </div>

    <p class="demo-hint">
      受控模式传 <code>:open</code> + 监听 <code>@update:open</code>；<code>expandable=false</code>
      时头部渲染成静态行（无箭头、不可点击、不渲染折叠体），适合"只是想借井面排版放一行摘要"的场景。
    </p>
  </div>
</template>
