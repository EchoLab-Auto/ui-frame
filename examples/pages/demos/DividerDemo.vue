<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField, DemoPresets, type DemoPreset } from '../../demo'

type DividerDirection = 'horizontal' | 'vertical'
type DividerAlign = 'left' | 'center' | 'right'

// ---- 配置台状态 ----
const direction = ref<DividerDirection>('horizontal')
const align = ref<DividerAlign>('center')
const dashed = ref(false)
const inset = ref(false)
const text = ref('分区 A')

const directionOptions = [
  { label: '水平', value: 'horizontal' },
  { label: '垂直', value: 'vertical' },
]
const alignOptions = [
  { label: '居左', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '居右', value: 'right' },
]

function reset() {
  direction.value = 'horizontal'
  align.value = 'center'
  dashed.value = false
  inset.value = false
  text.value = '分区 A'
}

// ---- 变体一览 ----
interface PresetRow {
  key: string
  code: string
  target: { direction: DividerDirection; align: DividerAlign; dashed: boolean; inset: boolean }
}

/**
 * 垂直分割线不吃 align（组件只在 horizontal 时才拼 `nm-divider--<align>`），
 * 所以垂直格的 target.align 一律回落到 center，点按时顺手把无效配置清掉。
 */
const presetRows: PresetRow[] = [
  {
    key: 'center',
    code: '默认（居中 + 实线）',
    target: { direction: 'horizontal', align: 'center', dashed: false, inset: false },
  },
  {
    key: 'left',
    code: 'align="left"',
    target: { direction: 'horizontal', align: 'left', dashed: false, inset: false },
  },
  {
    key: 'right',
    code: 'align="right"',
    target: { direction: 'horizontal', align: 'right', dashed: false, inset: false },
  },
  {
    key: 'dashed',
    code: 'dashed',
    target: { direction: 'horizontal', align: 'center', dashed: true, inset: false },
  },
  {
    key: 'inset',
    code: 'inset',
    target: { direction: 'horizontal', align: 'center', dashed: false, inset: true },
  },
  {
    key: 'vertical',
    code: 'direction="vertical"',
    target: { direction: 'vertical', align: 'center', dashed: false, inset: false },
  },
  {
    key: 'vertical-dashed',
    code: 'direction="vertical" dashed',
    target: { direction: 'vertical', align: 'center', dashed: true, inset: false },
  },
]

const presets = computed<DemoPreset[]>(() =>
  presetRows.map(row => ({
    key: row.key,
    code: row.code,
    active:
      row.target.direction === direction.value &&
      row.target.align === align.value &&
      row.target.dashed === dashed.value &&
      row.target.inset === inset.value,
  }))
)

function rowOf(key: string): PresetRow {
  return presetRows.find(r => r.key === key)!
}

function applyPreset(key: string) {
  const row = presetRows.find(r => r.key === key)
  if (!row) return
  direction.value = row.target.direction
  align.value = row.target.align
  dashed.value = row.target.dashed
  inset.value = row.target.inset
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = []
  if (direction.value === 'vertical') attrs.push('direction="vertical"')
  // 居中既是默认值，也是垂直方向唯一有意义的取值
  if (align.value !== 'center' && direction.value === 'horizontal') {
    attrs.push(`align="${align.value}"`)
  }
  if (dashed.value) attrs.push('dashed')
  if (inset.value) attrs.push('inset')

  const attrText = attrs.map(a => ` ${a}`).join('')
  const body = text.value.trim()
  return body
    ? `<NeumorphismDivider${attrText}>${body}</NeumorphismDivider>`
    : `<NeumorphismDivider${attrText} />`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :stage-switch="false" :snippet="snippet">
      <!-- 水平：给上下文两行字，才看得出分割线是「隔开内容」而不是一条孤线 -->
      <div v-if="direction === 'horizontal'" style="width: 100%; max-width: 460px">
        <p class="demo-hint" style="margin: 0 0 4px">分割线上方内容</p>
        <NeumorphismDivider :align="align" :dashed="dashed" :inset="inset">
          {{ text }}
        </NeumorphismDivider>
        <p class="demo-hint" style="margin: 4px 0 0">分割线下方内容</p>
      </div>

      <div v-else class="demo-row" style="min-height: 64px">
        <span>左侧</span>
        <NeumorphismDivider direction="vertical" :dashed="dashed" :inset="inset" />
        <span>中间</span>
        <NeumorphismDivider direction="vertical" :dashed="dashed" :inset="inset" />
        <span>右侧</span>
      </div>

      <template #spec>
        direction=<b>{{ direction }}</b> · align=<b>{{
          direction === 'horizontal' ? align : '—'
        }}</b>
        <template v-if="dashed"> · dashed</template>
        <template v-if="inset"> · inset</template>
      </template>

      <template #hint>
        <code>align</code> 只在水平方向生效（组件仅对 horizontal 拼
        <code>nm-divider--&lt;align&gt;</code>）；<code>inset</code>
        是「两边各让出一段」的内缩变体。 文字为空时不渲染
        <code>.nm-divider__text</code>，退化成一条纯线。
      </template>

      <template #config>
        <DemoField label="方向 direction">
          <NeumorphismSegmented v-model="direction" :options="directionOptions" size="small" />
        </DemoField>

        <DemoField label="对齐 align">
          <NeumorphismSegmented
            v-model="align"
            :options="alignOptions"
            :disabled="direction === 'vertical'"
            size="small"
          />
        </DemoField>

        <DemoField label="文字内容">
          <NeumorphismInput v-model="text" size="small" placeholder="留空则只有线" />
        </DemoField>

        <DemoField label="样式">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="dashed" size="small" />
              <span>dashed</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="inset" size="small" />
              <span>inset</span>
            </label>
          </div>
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="pressed" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">水平方向（带文字）</h4>
    <NeumorphismDivider>分区 A</NeumorphismDivider>
    <p class="demo-hint">分割线之间的内容</p>
    <NeumorphismDivider align="left">居左对齐</NeumorphismDivider>
    <p class="demo-hint">内容</p>
    <NeumorphismDivider align="right" dashed>居右对齐（虚线）</NeumorphismDivider>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">垂直方向</h4>
    <div class="demo-row">
      <span>左侧</span>
      <NeumorphismDivider direction="vertical" />
      <span>中间</span>
      <NeumorphismDivider direction="vertical" dashed />
      <span>右侧</span>
    </div>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">全部变体一览（点击载入到上方配置台）</h4>
    <DemoPresets :items="presets" @pick="applyPreset">
      <template #default="{ item }">
        <!-- overflow: hidden —— 带文字的水平分割线两侧各有 120px 定长虚线，
             不裁掉会跨出 150px 宽的格子 -->
        <div style="width: 100%; overflow: hidden">
          <NeumorphismDivider
            v-if="rowOf(item.key).target.direction === 'horizontal'"
            :align="rowOf(item.key).target.align"
            :dashed="rowOf(item.key).target.dashed"
            :inset="rowOf(item.key).target.inset"
            >分隔</NeumorphismDivider
          >
          <!-- 垂直方向需要两侧有内容才撑得出高度，否则只有一根 1em 的短线 -->
          <div v-else class="demo-row" style="justify-content: center; height: 32px; gap: 0">
            <span style="font-size: 12px">A</span>
            <NeumorphismDivider
              direction="vertical"
              :dashed="rowOf(item.key).target.dashed"
              :inset="rowOf(item.key).target.inset"
            />
            <span style="font-size: 12px">B</span>
          </div>
        </div>
      </template>
    </DemoPresets>
  </div>
</template>
