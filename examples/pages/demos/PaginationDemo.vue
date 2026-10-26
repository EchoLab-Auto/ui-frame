<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type PageSize = 10 | 20 | 50
type PaginationSize = 'small' | 'medium' | 'large'

interface DemoOption<T> {
  label: string
  value: T
}

// ---- 配置台状态 ----
const total = ref(100)
const pageSize = ref<PageSize>(10)
const size = ref<PaginationSize>('medium')
const showTotal = ref(false)
const showJumper = ref(false)
/** 按钮边长（px）：走演示级 CSS 变量桥接，组件源码零改动 */
const itemSize = ref(38)
const page = ref(1)

const pageSizeOptions: DemoOption<PageSize>[] = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
]
const sizeOptions: DemoOption<PaginationSize>[] = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

/**
 * 受控当前页。
 *
 * total / pageSize 一改，原页码可能超出总页数（例如 100 条 10/页 停在第 10 页，
 * 切到 50/页 后只剩 2 页）。组件只在算 prev/next 可用性时内部夹紧，
 * 模板里的高亮比对和跳页输入框仍读原始 modelValue——不夹就会渲染出
 * 「没有高亮页 + 输入框停在第 12 页」的僵局，所以在 getter 里夹紧。
 */
const pageModel = computed<number>({
  get: () => Math.min(Math.max(page.value, 1), totalPages.value),
  set: value => {
    page.value = value
  },
})
const itemSizeBridge = computed(() => ({ '--demo-pagination-size': `${itemSize.value}px` }))

/** 恢复默认：配置台「恢复默认」按钮直接调它 */
function reset(): void {
  total.value = 100
  pageSize.value = 10
  showTotal.value = false
  showJumper.value = false
  page.value = 1
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = ['v-model="page"', `:total="${total.value}"`]
  // page-size 默认 10、size 默认 medium、两个布尔默认 false，非默认才写
  if (pageSize.value !== 10) attrs.push(`:page-size="${pageSize.value}"`)
  if (showTotal.value) attrs.push('show-total')
  if (showJumper.value) attrs.push('show-jumper')
  if (size.value !== 'medium') attrs.push(`size="${size.value}"`)
  const open = `<NeumorphismPagination ${attrs.join(' ')} />`
  // 该变量只是演示页的桥接，不进组件 API，因此单独注释、不混进属性列表
  const bridge =
    itemSize.value !== 38
      ? `\n<!-- 按钮边长经演示桥接：--demo-pagination-size: ${itemSize.value}px -->`
      : ''
  return `${open}${bridge}`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <div class="demo-size-pagination" :style="itemSizeBridge">
        <NeumorphismPagination
          v-model="pageModel"
          :total="total"
          :page-size="pageSize"
          :size="size"
          :show-total="showTotal"
          :show-jumper="showJumper"
        />
      </div>

      <p class="demo-hint" style="margin: 0">
        当前页：<strong>{{ pageModel }}</strong> / {{ totalPages }}
      </p>

      <template #spec>
        total=<b>{{ total }}</b> · pageSize=<b>{{ pageSize }}</b> · 共 <b>{{ totalPages }}</b> 页 ·
        size=<b>{{ size }}</b> · 按钮 <b>{{ itemSize }}px</b>
        <template v-if="showTotal"> · show-total</template>
        <template v-if="showJumper"> · show-jumper</template>
      </template>

      <template #hint>
        页码超过 <code>maxVisiblePages</code>（默认 7）时，首末页保留、中间折叠成
        <code>…</code>；<code>show-total</code> 用 locale 模板渲染总数，
        <code>show-jumper</code> 额外给一个页码输入框。
      </template>

      <template #config>
        <DemoField label="总数 total" :value="String(total)" grow>
          <NeumorphismSlider v-model="total" :min="50" :max="1000" :step="10" size="small" />
        </DemoField>

        <DemoField label="每页 pageSize">
          <NeumorphismSegmented v-model="pageSize" :options="pageSizeOptions" size="small" />
        </DemoField>

        <DemoField label="尺寸 size">
          <NeumorphismSegmented v-model="size" :options="sizeOptions" size="small" />
        </DemoField>

        <DemoField label="按钮边长" :value="`${itemSize}px`" grow>
          <!-- 桥接只认 medium 档（全局样式写死在 .demo-size-pagination .nm-pagination--medium），
               其余档位用自身预设 30/46px，因此这里禁用而不是假装有效 -->
          <NeumorphismSlider
            v-model="itemSize"
            :min="26"
            :max="56"
            :step="2"
            size="small"
            :disabled="size !== 'medium'"
          />
        </DemoField>

        <DemoField label="附加">
          <div class="demo-row" style="gap: 16px">
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="showTotal" size="small" />
              <span>show-total</span>
            </label>
            <label class="demo-toggle">
              <NeumorphismSwitch v-model="showJumper" size="small" />
              <span>show-jumper</span>
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
  </div>
</template>
