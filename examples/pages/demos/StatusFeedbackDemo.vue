<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

// 状态点的四种枚举值，与 StatusDot 的 StatusDotStatus 一一对应
type StatusDotStatus = 'online' | 'offline' | 'busy' | 'connecting'

// ---- 配置台状态 ----
const dotStatus = ref<StatusDotStatus>('online')
const spinnerDiameter = ref(28)
/** 分段选择的项数：2 项 = 只剩黑白名单，3 项 = 多一个「无约束」 */
const segmentedOptionCount = ref(3)
const demoSegmented = ref<string | number>('allowlist')

const dotStatusOptions: { label: string; value: StatusDotStatus }[] = [
  { label: '在线', value: 'online' },
  { label: '离线', value: 'offline' },
  { label: '忙碌', value: 'busy' },
  { label: '连接中', value: 'connecting' },
]

/** 中文状态名：预览读数与配置台共用（StatusDot 自身的 aria-label 走 locale） */
const statusText: Record<string, string> = {
  online: '在线',
  offline: '离线',
  busy: '忙碌',
  connecting: '连接中',
}

/**
 * 两套选项常量。
 *
 * 「选项集」本身是被配置的对象，所以必须换整份数组而不是 push/pop——分段控件的
 * roving focus 索引按数组下标维护，原地增删会让索引与选中值在同一个 tick 内互相打架，
 * 换整份数组时 useSegmented 的 watch 会一次性把索引钳制回合法位置。
 */
const segmentedOptionsShort = [
  { label: '白名单', value: 'allowlist' },
  { label: '黑名单', value: 'denylist' },
]
const segmentedOptionsFull = [
  { label: '无约束', value: 'none' },
  { label: '白名单', value: 'allowlist' },
  { label: '黑名单', value: 'denylist' },
]

const demoSegmentedOptions = computed(() =>
  segmentedOptionCount.value === 2 ? segmentedOptionsShort : segmentedOptionsFull
)

// 收缩选项集后旧值可能已不在集合里：必须回落到第一项，否则整组一个都不高亮
watch(segmentedOptionCount, () => {
  const options = demoSegmentedOptions.value
  if (!options.some(option => option.value === demoSegmented.value)) {
    demoSegmented.value = options[0].value
  }
})

const segmentedCountOptions = [
  { label: '2 项', value: 2 },
  { label: '3 项', value: 3 },
]

/**
 * Spinner 的三个档位。
 *
 * 档位只是像素值的别名（见组件里的 SIZE_MAP），几何统一由 `--nm-spinner-size` 驱动；
 * 不传 size 时取全局配置 spinner.size，兜底是 medium。
 */
const spinnerSizes: { size: 'small' | 'medium' | 'large'; px: number }[] = [
  { size: 'small', px: 14 },
  { size: 'medium', px: 20 },
  { size: 'large', px: 28 },
]

// 独立的一份分段选择：专供方向键/禁用项演示，不参与上方配置
const navSegmented = ref<string | number>('day')
const navSegmentedOptions = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '自定义（未开放）', value: 'custom', disabled: true },
]

function reset() {
  dotStatus.value = 'online'
  spinnerDiameter.value = 28
  segmentedOptionCount.value = 3
  demoSegmented.value = 'allowlist'
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const lines = [
    // online 是默认值，按「默认不写」的约定省略属性
    dotStatus.value === 'online'
      ? '<NeumorphismStatusDot />'
      : `<NeumorphismStatusDot status="${dotStatus.value}" />`,
    `<NeumorphismSpinner :size="${spinnerDiameter.value}" />`,
    '',
    // options 是必填项，必须把数组原样写进片段，否则粘过去跑不起来
    '<NeumorphismSegmented',
    '  v-model="mode"',
    '  :options="[',
    ...demoSegmentedOptions.value.map(
      option => `    { label: '${option.label}', value: '${option.value}' },`
    ),
    '  ]"',
    '/>',
  ]
  return lines.join('\n')
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（状态点 / 加载指示 / 分段选择）</h4>
    <DemoPlayground :snippet="snippet" :stage-switch="false">
      <div class="demo-row" style="gap: 24px; justify-content: center">
        <span style="display: inline-flex; align-items: center; gap: 6px">
          <NeumorphismStatusDot :status="dotStatus" />
          <span style="font-size: 13px">{{ statusText[dotStatus] }}</span>
        </span>

        <NeumorphismSpinner :size="spinnerDiameter" />

        <NeumorphismSegmented v-model="demoSegmented" :options="demoSegmentedOptions" />
      </div>

      <template #spec>
        status=<b>{{ dotStatus }}</b> · spinner=<b>{{ spinnerDiameter }}px</b> · 分段
        <b>{{ demoSegmentedOptions.length }} 项</b>（选中 <b>{{ demoSegmented }}</b
        >）
      </template>

      <template #hint>
        <code>pulse</code> 只对过渡态有意义：<code>busy</code> /
        <code>connecting</code> 会呼吸脉冲，<code>online</code> /
        <code>offline</code> 是静止事实，不呼吸。<br />
        <code>size</code> 传数字时优先级高于档位（<code>small 14 / medium 20 / large 28</code>），
        <b>数字优先</b>。
      </template>

      <template #config>
        <DemoField label="状态 status">
          <NeumorphismSegmented v-model="dotStatus" :options="dotStatusOptions" size="small" />
        </DemoField>

        <DemoField label="直径 size" :value="`${spinnerDiameter}px`" grow>
          <NeumorphismSlider v-model="spinnerDiameter" :min="12" :max="48" :step="2" size="small" />
        </DemoField>

        <DemoField label="选项集">
          <NeumorphismSegmented
            v-model="segmentedOptionCount"
            :options="segmentedCountOptions"
            size="small"
          />
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
    <h4 class="demo-label">Spinner 三档尺寸（14 / 20 / 28）</h4>
    <div class="demo-row" style="gap: 32px; align-items: flex-end">
      <div
        v-for="item in spinnerSizes"
        :key="item.size"
        style="display: flex; flex-direction: column; align-items: center; gap: 8px"
      >
        <NeumorphismSpinner :size="item.size" />
        <code style="font-size: 12px">{{ item.size }} · {{ item.px }}px</code>
      </div>
    </div>
    <p class="demo-hint">
      档位只是像素值的别名（<code>small 14 / medium 20 / large 28</code>），几何全部由
      <code>--nm-spinner-size</code> 驱动。传数字和传档位走同一条路径，没有两套样式。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">Segmented 分段选择（方向键可导航）</h4>
    <div class="demo-row" style="gap: 20px">
      <NeumorphismSegmented v-model="demoSegmented" :options="demoSegmentedOptions" />
      <code style="font-size: 13px">当前值: {{ demoSegmented }}</code>
    </div>

    <div class="demo-row" style="margin-top: 12px">
      <NeumorphismSegmented v-model="navSegmented" :options="navSegmentedOptions" />
      <code style="font-size: 13px">当前值: {{ navSegmented }}</code>
    </div>

    <p class="demo-hint">
      焦点进组后 <kbd>←</kbd> <kbd>→</kbd>（或 <kbd>↑</kbd> <kbd>↓</kbd>）在
      <b>可用项之间循环</b>并即时选中，<kbd>Home</kbd> / <kbd>End</kbd> 跳到首尾；<code
        >disabled</code
      >
      项会被 roving tabindex 直接跳过（上面那组「自定义」永远选不中）。
    </p>
  </div>
</template>
