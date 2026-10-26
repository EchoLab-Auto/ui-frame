<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField, DemoPresets, type DemoPreset } from '../../demo'

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

/** 尺寸调参演示里那份固定 5 页数据（不受配置台影响，保留原始演示） */
const page2 = ref(3)
const itemSizeBridge = computed(() => ({ '--demo-pagination-size': `${itemSize.value}px` }))

// ---- 变体一览 ----
interface PaginationPresetRow extends DemoPreset {
  total: number
  pageSize: PageSize
  showTotal: boolean
  showJumper: boolean
  label: string
}

const presetRows: PaginationPresetRow[] = [
  {
    key: 'basic',
    code: ':total="100"',
    total: 100,
    pageSize: 10,
    showTotal: false,
    showJumper: false,
    label: '100 条 · 10/页',
  },
  {
    key: 'total-jumper',
    code: ':total="1000" :page-size="20" show-total show-jumper',
    total: 1000,
    pageSize: 20,
    showTotal: true,
    showJumper: true,
    label: '1000 条 · 总数 + 跳转',
  },
  {
    key: 'short',
    code: ':total="50"',
    total: 50,
    pageSize: 10,
    showTotal: false,
    showJumper: false,
    label: '50 条 · 5 页',
  },
  {
    key: 'long',
    code: ':total="500" :page-size="50"',
    total: 500,
    pageSize: 50,
    showTotal: false,
    showJumper: false,
    label: '500 条 · 50/页',
  },
]

const presets = computed<DemoPreset[]>(() =>
  presetRows.map(row => ({
    key: row.key,
    code: row.code,
    active:
      row.total === total.value &&
      row.pageSize === pageSize.value &&
      row.showTotal === showTotal.value &&
      row.showJumper === showJumper.value,
  }))
)

function applyPreset(key: string) {
  const row = presetRows.find(item => item.key === key)
  if (!row) return
  total.value = row.total
  pageSize.value = row.pageSize
  showTotal.value = row.showTotal
  showJumper.value = row.showJumper
  page.value = 1
}

function rowOf(key: string) {
  return presetRows.find(item => item.key === key)!
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
          <NeumorphismButton variant="raised" size="small" @click="applyPreset('basic')">
            恢复默认
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">显示总数与跳转（500 条 / 每页 20 → 25 页）</h4>
    <NeumorphismPagination
      v-model="page2"
      :total="500"
      :page-size="20"
      :show-total="true"
      :show-jumper="true"
    />
    <p class="demo-hint">
      跳转输入框按 <code>change</code> 提交，输入超界时由 <code>usePagination</code> 夹到
      1..总页数。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">按钮尺寸调参（--demo-pagination-size 桥接）</h4>
    <div class="demo-row demo-row--stacked" style="gap: 14px">
      <div class="demo-row">
        <NeumorphismSlider
          v-model="itemSize"
          :min="26"
          :max="56"
          :step="2"
          style="width: 200px; flex: 0 0 200px"
        />
        <code>{{ itemSize }}px</code>
      </div>
      <div class="demo-size-pagination" :style="itemSizeBridge">
        <NeumorphismPagination v-model="page2" :total="50" :page-size="10" />
      </div>
    </div>
    <p class="demo-hint">
      页码按钮的 <code>min-width / height / font-size</code> 都由
      <code>--demo-pagination-size</code> 推导（字号 = 边长 × 0.368）。 桥接类
      <code>.demo-size-pagination</code> 只覆盖 <code>medium</code> 档，<code>small</code> /
      <code>large</code> 走组件自带预设 30/46px。
    </p>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">数据规模一览（点击载入到上方预览）</h4>
    <DemoPresets :items="presets" @pick="applyPreset">
      <template #default="{ item }">
        <span style="font-size: 12px">{{ rowOf(item.key).label }}</span>
      </template>
    </DemoPresets>
  </div>
</template>
