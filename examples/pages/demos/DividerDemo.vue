<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

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
</template>
