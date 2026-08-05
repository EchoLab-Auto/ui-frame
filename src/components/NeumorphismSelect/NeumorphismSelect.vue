<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useSelect } from '@/composables/useSelect'
import type { SelectOption } from '@/composables/useSelect'
import { useFormField } from '@/composables/useFormField'
import { useConfig } from '@/composables/useConfig'
import { useFloatingPosition } from '@/composables/useFloatingPosition'
import { useLocale } from '@/composables/useLocale'
import { useZIndex } from '@/composables/useZIndex'
import NeumorphismFieldLabel from '@/components/NeumorphismField/NeumorphismFieldLabel.vue'
import NeumorphismFieldError from '@/components/NeumorphismField/NeumorphismFieldError.vue'
import NeumorphismTag from '@/components/NeumorphismTag/NeumorphismTag.vue'

export type { SelectOption as NeumorphismSelectOption }

export interface NeumorphismSelectProps {
  modelValue?: string | number | (string | number)[]
  options?: SelectOption[]
  placeholder?: string
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  label?: string
  required?: boolean
  error?: string | boolean
  name?: string
  id?: string
  clearable?: boolean
  emptyText?: string
  clearLabel?: string
  listLabel?: string
  /** 多选模式 — modelValue 为数组 */
  multiple?: boolean
  /** 可搜索 — 触发器内嵌输入框，输入即过滤选项 */
  filterable?: boolean
  /** 加载状态（远程数据场景） */
  loading?: boolean
  /** 加载提示文字 */
  loadingText?: string
  /** 多选标签折叠 — 超出 maxCollapseTags 的部分以 +N 计数展示 */
  collapseTags?: boolean
  /** 多选折叠前展示的标签数 */
  maxCollapseTags?: number
  /** 视觉变体：default 新拟态凹陷 / outlined 描边扁平 + 连体下拉 */
  variant?: 'default' | 'outlined'
}

const props = withDefaults(defineProps<NeumorphismSelectProps>(), {
  modelValue: '',
  options: () => [],
  placeholder: '',
  disabled: false,
  clearable: false,
  emptyText: '',
  clearLabel: '',
  listLabel: '',
  loading: false,
  loadingText: '',
  maxCollapseTags: 1,
})

const config = useConfig()
const { t } = useLocale()
const resolvedSize = computed(() => props.size ?? config.value.select?.size ?? 'medium')
const resolvedPlaceholder = computed(() => props.placeholder || t('selectPlaceholder'))
const resolvedEmptyText = computed(() => props.emptyText || t('selectEmpty'))
const resolvedClearLabel = computed(() => props.clearLabel || t('selectClear'))
const resolvedListLabel = computed(() => props.listLabel || t('selectListLabel'))
const resolvedLoadingText = computed(() => props.loadingText || t('selectLoading'))
// 新功能全部走三级级联：显式 prop > 全局配置 > 默认关闭，保持默认用法零变化
const resolvedMultiple = computed(() => props.multiple ?? config.value.select?.multiple ?? false)
const resolvedFilterable = computed(
  () => props.filterable ?? config.value.select?.filterable ?? false
)
const resolvedCollapseTags = computed(
  () => props.collapseTags ?? config.value.select?.collapseTags ?? false
)
const resolvedVariant = computed(() => props.variant ?? config.value.select?.variant ?? 'default')

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | (string | number)[] | undefined): void
  (e: 'change', value: string | number | (string | number)[] | undefined): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'visible-change', open: boolean): void
  (e: 'remove-tag', value: string | number): void
  (e: 'search', query: string): void
}>()

// Use headless select composable for all behavioral logic
const modelRef = computed({
  get: () => props.modelValue,
  set: val => {
    emit('update:modelValue', val)
    emit('change', val)
  },
})

const filterText = ref('')

const {
  isOpen,
  selectedOption,
  selectedOptions,
  filteredOptions,
  groupedOptions,
  activeValue,
  isSelected,
  toggleOpen,
  selectOption,
  removeValue,
  clearValue,
  handleKeydown,
  handleBlur: onSelectBlur,
} = useSelect({
  modelValue: modelRef,
  options: computed(() => props.options),
  disabled: computed(() => props.disabled),
  multiple: resolvedMultiple,
  filterText,
})

const { fieldId, errorMessage, hasError, baseClassList, handleFocus, handleBlur } = useFormField(
  () => ({
    id: props.id,
    size: resolvedSize.value,
    disabled: props.disabled,
    error: props.error,
    prefix: 'select',
  })
)

const hasValue = computed(() =>
  resolvedMultiple.value
    ? selectedOptions.value.length > 0
    : props.modelValue !== '' && props.modelValue !== undefined && props.modelValue !== null
)

// 触发器的 open 视觉（层叠提升 / 描边点亮）与下拉实体绑定：
// 展开时立即生效；收起时等下拉的 leave 动画结束（@after-leave）再解除
const visualOpen = ref(false)

// 展开动画结束（@after-enter）后才放开下拉内部滚动 ——
// 动画期间 overflow:hidden，避免滚动条随高度变化闪烁
const settledOpen = ref(false)

const classList = computed(() => [
  ...baseClassList('nm-select').value,
  {
    'nm-select--open': visualOpen.value,
    'nm-select--has-value': hasValue.value,
    'nm-select--multiple': resolvedMultiple.value,
    'nm-select--filterable': resolvedFilterable.value,
    'nm-select--outlined': resolvedVariant.value === 'outlined',
    // 向上翻转：盒体 column-reverse + 负 margin-top 补偿 + 投影镜像
    'nm-select--drop-up': visualOpen.value && placement.value === 'top',
    // 发光时序独立于几何（--open）：与面板动画同生共灭 ——
    // 展开时随面板抽出淡入，收起时随面板抽回同时开始淡出，与展开严格对称
    'nm-select--glowing': isOpen.value,
    'nm-select--settled': settledOpen.value,
  },
])

// ==========================================
// 多选标签
// ==========================================
const visibleTags = computed(() =>
  resolvedCollapseTags.value
    ? selectedOptions.value.slice(0, props.maxCollapseTags)
    : selectedOptions.value
)
const collapsedCount = computed(() => selectedOptions.value.length - visibleTags.value.length)

function onRemoveTag(value: string | number) {
  removeValue(value)
  emit('remove-tag', value)
}

// ==========================================
// 可搜索输入框
// ==========================================
const filterInputRef = ref<HTMLInputElement>()

// 单选：收起时输入框展示选中项 label，展开后切换为过滤文本
const inputDisplayValue = computed(() => {
  if (resolvedMultiple.value) return filterText.value
  return isOpen.value ? filterText.value : (selectedOption.value?.label ?? '')
})

const inputPlaceholder = computed(() => {
  if (resolvedMultiple.value) return hasValue.value ? '' : resolvedPlaceholder.value
  return selectedOption.value?.label || resolvedPlaceholder.value
})

// 单选收起时只读 —— 避免用户在选中 label 上继续键入；
// 聚焦/点击会展开下拉，展开后即可输入过滤
const inputReadonly = computed(
  () => !resolvedMultiple.value && !isOpen.value && resolvedFilterable.value
)

function onFilterInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  filterText.value = value
  emit('search', value)
  if (!isOpen.value) isOpen.value = true
}

// filterable 模式下键盘 Tab 聚焦 input 也应展开下拉 —— 否则 readonly 收起态
// 下用户无法直接打字过滤（展开只绑在 click 上，键盘路径触达不到）
function onInputFocus(event: FocusEvent) {
  handleFocus(event, emit)
  if (!isOpen.value) isOpen.value = true
}

function onKeydown(event: KeyboardEvent) {
  // 可搜索模式下可打印字符交给输入框原生处理，不触发 typeahead
  if (
    resolvedFilterable.value &&
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    return
  }
  handleKeydown(event)
}

// ==========================================
// 触发器
// ==========================================
const triggerRef = ref<HTMLElement>()

function onTriggerClick() {
  if (props.disabled) return
  if (resolvedFilterable.value) {
    filterInputRef.value?.focus()
    isOpen.value = true
    return
  }
  toggleOpen()
}

function onClear(event: Event) {
  event.stopPropagation()
  clearValue()
}

/** 暴露给父组件的焦点方法 */
function focus() {
  ;(resolvedFilterable.value ? filterInputRef.value : triggerRef.value)?.focus()
}
function blur() {
  ;(resolvedFilterable.value ? filterInputRef.value : triggerRef.value)?.blur()
}
defineExpose({ focus, blur })

// ==========================================
// 下拉定位 —— 共享浮层定位引擎（rAF 逐帧追踪 + 边界翻转滞后）
// ==========================================
const dropdownRef = ref<HTMLElement>()

const DROPDOWN_GAP = 6
// outlined 为单盒内联展开（无分离下拉），空间估算不加分间距；default 保持 6px 分离
const dropGap = computed(() => (resolvedVariant.value === 'outlined' ? 0 : DROPDOWN_GAP))

// 单盒纵向延展：盒体在文档流中长高会顶开下方内容 —— 逐帧以
// 「闭合高度 − 当前盒高」施加负 margin，与盒体实际增量逐帧锁定，布局零抖动。
// 直接测量盒体（而非读取下拉高度），天然兼容 min-height 余量/padding/border；
// 收起期间（leave）DOM 元素仍在过渡中，盒高同样准确
const closedBoxHeight = ref(0)

function syncMarginCompensation() {
  if (!triggerRef.value) return
  if (resolvedVariant.value !== 'outlined') {
    // 非单盒变体不产生补偿；清理可能残留的内联 margin（如运行时切换变体）
    triggerRef.value.style.marginBottom = ''
    triggerRef.value.style.marginTop = ''
    return
  }
  const grow = Math.max(triggerRef.value.offsetHeight - closedBoxHeight.value, 0)
  triggerRef.value.style.marginBottom = placement.value === 'top' ? '0px' : `${-grow}px`
  triggerRef.value.style.marginTop = placement.value === 'top' ? `${-grow}px` : '0px'
}

const {
  actualPlacement: placement,
  rect: dropdownRect,
  available: dropdownAvailable,
  refresh: refreshDropdownPosition,
  stop: stopPositionTracking,
} = useFloatingPosition({
  trigger: triggerRef,
  // 追踪存续期跟随 visualOpen —— 收起动画期间（isOpen 已 false）
  // 仍需逐帧同步负 margin 与位置，直到 @after-leave 停止
  open: visualOpen,
  placement: computed(() => 'bottom' as const),
  offset: dropGap,
  floating: dropdownRef,
  candidates: ['bottom', 'top'],
  // outlined 单盒会随展开长高 —— 逐帧判向会把盒底增长误判为空间不足，
  // 展开中途翻转（下拉从下方瞬跳到上方）。锁定为打开时一次性决策；
  // default 浮层翻转廉价，保留滚动中的滞后翻转
  lockPlacement: computed(() => resolvedVariant.value === 'outlined'),
  onFrame: syncMarginCompensation,
})

function scrollActiveIntoView() {
  if (!dropdownRef.value) return
  // 多选下 selected 与 active 可能不同；优先滚到键盘刚移到的 active 项，
  // 没有高亮项（单选）才落到 selected —— 否则会把视图拉向已选项而非当前导航位置
  const el = (dropdownRef.value.querySelector('.nm-select__option--active') ||
    dropdownRef.value.querySelector('.nm-select__option--selected')) as HTMLElement | null
  el?.scrollIntoView?.({ block: 'nearest' })
}

// 键盘导航改变选中/高亮项时，保持其处于可视区域
watch([selectedOption, activeValue], () => {
  if (isOpen.value) nextTick(scrollActiveIntoView)
})

// ==========================================
// 外部点击关闭
// ==========================================
// blur 关闭只在焦点曾落到触发器/输入框时有效 —— 但 tags 区、清除钮、
// 选项均有 @mousedown.prevent，从这些区域展开后焦点从未就位，
// Escape 与 blur 双双失效，多选会卡在展开态。以 document 捕获阶段
// pointerdown 兜底（捕获阶段不受选项 @mousedown.prevent / @click.stop 影响）。
function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (triggerRef.value?.contains(target) || dropdownRef.value?.contains(target)) return
  isOpen.value = false
}

watch(isOpen, open => {
  emit('visible-change', open)
  if (typeof document !== 'undefined') {
    if (open) document.addEventListener('pointerdown', onDocumentPointerDown, true)
    else document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  }
  if (open) {
    visualOpen.value = true
    // watch 先于渲染触发，此时盒体仍是闭合态 —— 记录闭合高度作为负 margin 基准
    closedBoxHeight.value = triggerRef.value?.offsetHeight ?? 0
    nextTick(() => {
      // 打开时全量重估方向与可用空间（后续滚动中仅在滞后条件满足时翻转）
      refreshDropdownPosition()
      scrollActiveIntoView()
    })
  } else {
    filterText.value = ''
    settledOpen.value = false
  }
})

// 收起动画真正结束（@after-leave）：解除 open 视觉并停止逐帧轮询。
// 轮询在收起期间必须存活 —— 它逐帧同步盒体负 margin 补偿
function onAfterLeave() {
  visualOpen.value = false
  stopPositionTracking()
  if (triggerRef.value) {
    triggerRef.value.style.marginBottom = ''
    triggerRef.value.style.marginTop = ''
  }
}

// 组件在展开状态下被卸载（v-if / 路由切换）时停止逐帧轮询并解绑外部监听，
// 否则 rAF 回调连同 triggerRef 闭包会泄漏
onBeforeUnmount(() => {
  stopPositionTracking()
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  }
})

const { getZIndex } = useZIndex()

const clampedAvailable = computed(() => Math.max(dropdownAvailable.value, 72))

const dropdownStyle = computed(() => {
  // 视口空间受限时收缩高度；token 仍可覆盖默认上限
  const maxHeight = `min(var(--nm-select-dropdown-max-height), ${clampedAvailable.value}px)`
  if (resolvedVariant.value === 'outlined') {
    // 单盒模型：下拉是盒内第二行，只需高度上限；定位由盒体自身完成
    return { maxHeight }
  }
  const r = dropdownRect.value
  const gap = dropGap.value
  return {
    position: 'fixed' as const,
    top: placement.value === 'bottom' ? `${(r?.bottom ?? 0) + gap}px` : undefined,
    bottom:
      placement.value === 'top'
        ? `${typeof window !== 'undefined' ? window.innerHeight - (r?.top ?? 0) + gap : 0}px`
        : undefined,
    left: `${r?.left ?? 0}px`,
    width: `${r?.width ?? 0}px`,
    maxHeight,
    zIndex: getZIndex('dropdown'),
  }
})

// ==========================================
// 选项渲染辅助
// ==========================================
const hasGroups = computed(
  () =>
    groupedOptions.value.length > 1 ||
    (groupedOptions.value.length === 1 && groupedOptions.value[0].name !== '')
)

// aria id 用索引而非原始 value 拼接 —— value 含空格/特殊字符时会产生非法 id
function optionIndex(option: SelectOption) {
  return filteredOptions.value.indexOf(option)
}
function optionId(option: SelectOption) {
  return `${fieldId}-opt-${optionIndex(option)}`
}

const activeDescendantId = computed(() => {
  const value = resolvedMultiple.value ? activeValue.value : selectedOption.value?.value
  if (value === undefined) return undefined
  const index = filteredOptions.value.findIndex(o => o.value === value)
  return index >= 0 ? `${fieldId}-opt-${index}` : undefined
})

const emptyDisplayText = computed(() =>
  filterText.value.trim() ? t('selectNoMatch') : resolvedEmptyText.value
)

// 值展示：单选显示选中 label，多选空态显示占位符（有值时由标签替代）
const showValueSpan = computed(
  () => !resolvedFilterable.value && !(resolvedMultiple.value && hasValue.value)
)
const valueDisplay = computed(() =>
  resolvedMultiple.value
    ? resolvedPlaceholder.value
    : selectedOption.value?.label || resolvedPlaceholder.value
)
const valueIsPlaceholder = computed(() =>
  resolvedMultiple.value ? !hasValue.value : !selectedOption.value
)

function onContainerBlur(e: FocusEvent) {
  // When dropdown is teleported to body, focus may move to dropdown items.
  // Don't close in that case — let the click handler do its work.
  if (dropdownRef.value?.contains(e.relatedTarget as Node)) {
    return
  }
  onSelectBlur(e.relatedTarget, e.currentTarget as HTMLElement)
  handleBlur(e, emit)
}
</script>

<template>
  <div class="nm-select__wrapper">
    <NeumorphismFieldLabel :label="label" :required="required" :for-id="fieldId" />
    <div
      ref="triggerRef"
      :class="classList"
      :tabindex="disabled || resolvedFilterable ? -1 : 0"
      :role="resolvedFilterable ? undefined : 'combobox'"
      :aria-expanded="resolvedFilterable ? undefined : isOpen"
      :aria-haspopup="resolvedFilterable ? undefined : 'listbox'"
      :aria-controls="resolvedFilterable ? undefined : `${fieldId}-listbox`"
      :aria-activedescendant="resolvedFilterable ? undefined : activeDescendantId"
      :aria-labelledby="!resolvedFilterable && label ? fieldId : undefined"
      :aria-label="!resolvedFilterable && !label ? resolvedPlaceholder : undefined"
      @click="onTriggerClick"
      @focus="(e: FocusEvent) => handleFocus(e, emit)"
      @blur="onContainerBlur"
      @keydown="onKeydown"
    >
      <div class="nm-select__face">
        <!-- 多选标签区（mousedown.prevent 保持焦点在触发器/输入框上，避免 blur 误关下拉） -->
        <span v-if="resolvedMultiple && hasValue" class="nm-select__tags" @mousedown.prevent>
          <NeumorphismTag
            v-for="tag in visibleTags"
            :key="tag.value"
            size="small"
            :closable="!disabled"
            @close="onRemoveTag(tag.value)"
          >
            {{ tag.label }}
          </NeumorphismTag>
          <NeumorphismTag v-if="collapsedCount > 0" size="small" class="nm-select__tag-collapse">
            +{{ collapsedCount }}
          </NeumorphismTag>
        </span>

        <!-- 可搜索输入框（combobox 语义移至原生 input，符合 ARIA 1.2 模式） -->
        <input
          v-if="resolvedFilterable"
          ref="filterInputRef"
          class="nm-select__input"
          :value="inputDisplayValue"
          :placeholder="inputPlaceholder"
          :disabled="disabled"
          :readonly="inputReadonly"
          role="combobox"
          :aria-expanded="isOpen"
          aria-haspopup="listbox"
          :aria-controls="`${fieldId}-listbox`"
          :aria-activedescendant="activeDescendantId"
          :aria-labelledby="label ? fieldId : undefined"
          :aria-label="label ? undefined : t('selectSearchLabel')"
          aria-autocomplete="list"
          @input="onFilterInput"
          @focus="onInputFocus"
          @blur="onContainerBlur"
          @keydown="onKeydown"
        />

        <!-- 单选值展示 / 多选空占位 -->
        <span
          v-else-if="showValueSpan"
          class="nm-select__value"
          :class="{ 'nm-select__value--placeholder': valueIsPlaceholder }"
        >
          <!-- @slot Custom selected value display -->
          <slot name="value" :option="selectedOption">
            {{ valueDisplay }}
          </slot>
        </span>

        <span class="nm-select__actions">
          <button
            v-if="clearable && hasValue && !loading && !disabled"
            class="nm-select__clear"
            type="button"
            :aria-label="resolvedClearLabel"
            @mousedown.prevent
            @click="onClear"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <svg
            v-if="loading"
            class="nm-select__spinner"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M12 2a10 10 0 1 0 10 10" />
          </svg>
          <svg
            v-else
            class="nm-select__arrow"
            :class="{ 'nm-select__arrow--open': isOpen }"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>

      <!--
        outlined：禁用 teleport —— 单盒模型，下拉渲染在盒内第二行，
        盒体随下拉的 max-height 过渡纵向延展（盒体负 margin 同参同步补偿，
        布局零抖动），接缝从构造上不存在；
        default：teleport 浮层（不受祖先 overflow 裁剪与层叠上下文影响）
      -->
      <teleport to="body" :disabled="resolvedVariant === 'outlined'">
        <transition
          name="nm-select-dropdown"
          @after-enter="settledOpen = true"
          @after-leave="onAfterLeave"
        >
          <div
            v-if="isOpen"
            :id="`${fieldId}-listbox`"
            ref="dropdownRef"
            class="nm-select__dropdown"
            :class="{
              'nm-select__dropdown--up': placement === 'top',
              'nm-select__dropdown--multiple': resolvedMultiple,
              'nm-select__dropdown--outlined': resolvedVariant === 'outlined',
              'nm-select__dropdown--error': hasError,
            }"
            role="listbox"
            :aria-label="label || resolvedListLabel"
            :aria-multiselectable="resolvedMultiple || undefined"
            :style="dropdownStyle"
            @mousedown.prevent
            @click.stop
          >
            <!-- 加载态 -->
            <div v-if="loading" class="nm-select__loading">
              <svg
                class="nm-select__loading-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M12 2a10 10 0 1 0 10 10" />
              </svg>
              <span>{{ resolvedLoadingText }}</span>
            </div>

            <!-- 分组渲染 -->
            <template v-else-if="hasGroups && filteredOptions.length > 0">
              <template v-for="group in groupedOptions" :key="group.name || '__ungrouped__'">
                <div v-if="group.name" class="nm-select__group-title" aria-hidden="true">
                  {{ group.name }}
                </div>
                <!-- @slot Custom option rendering. Bind: option, selected, index, select -->
                <slot
                  v-for="option in group.options"
                  :key="option.value"
                  name="option"
                  :option="option"
                  :selected="isSelected(option)"
                  :index="optionIndex(option)"
                  :select="selectOption"
                >
                  <div
                    :id="optionId(option)"
                    class="nm-select__option"
                    :class="{
                      'nm-select__option--selected': isSelected(option),
                      'nm-select__option--disabled': option.disabled,
                      'nm-select__option--active': resolvedMultiple && option.value === activeValue,
                    }"
                    role="option"
                    :aria-selected="isSelected(option)"
                    :aria-disabled="option.disabled"
                    @mousedown.prevent
                    @click.stop="selectOption(option)"
                  >
                    <span
                      v-if="resolvedMultiple"
                      class="nm-select__checkbox"
                      :class="{ 'nm-select__checkbox--checked': isSelected(option) }"
                      aria-hidden="true"
                    >
                      <svg
                        v-if="isSelected(option)"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3.5"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    <span class="nm-select__option-label">{{ option.label }}</span>
                  </div>
                </slot>
              </template>
            </template>

            <!-- 平铺渲染 -->
            <template v-else-if="filteredOptions.length > 0">
              <!-- @slot Custom option rendering. Bind: option, selected, index, select -->
              <slot
                v-for="(option, index) in filteredOptions"
                :key="option.value"
                name="option"
                :option="option"
                :selected="isSelected(option)"
                :index="index"
                :select="selectOption"
              >
                <div
                  :id="optionId(option)"
                  class="nm-select__option"
                  :class="{
                    'nm-select__option--selected': isSelected(option),
                    'nm-select__option--disabled': option.disabled,
                    'nm-select__option--active': resolvedMultiple && option.value === activeValue,
                  }"
                  role="option"
                  :aria-selected="isSelected(option)"
                  :aria-disabled="option.disabled"
                  @click.stop="selectOption(option)"
                >
                  <span
                    v-if="resolvedMultiple"
                    class="nm-select__checkbox"
                    :class="{ 'nm-select__checkbox--checked': isSelected(option) }"
                    aria-hidden="true"
                  >
                    <svg
                      v-if="isSelected(option)"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3.5"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <span class="nm-select__option-label">{{ option.label }}</span>
                </div>
              </slot>
            </template>

            <!-- 空态 / 无匹配 -->
            <div v-else class="nm-select__option nm-select__option--empty nm-select__empty">
              <svg
                class="nm-select__empty-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                <path
                  d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
                />
              </svg>
              <span>{{ emptyDisplayText }}</span>
            </div>
          </div>
        </transition>
      </teleport>
    </div>
    <NeumorphismFieldError :id="`${fieldId}-error`" :message="errorMessage" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-select__wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-sm);
  width: 100%;
}

.nm-select__face {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
}

.nm-select {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  outline: none;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-inset(4px, 8px);
  transition:
    box-shadow 0.35s $nm-ease-spring,
    background-color var(--nm-transition-slow),
    color var(--nm-transition-slow),
    transform 0.3s $nm-ease-spring;

  // hover 反馈与 NeumorphismInput 对齐：凹陷加深 + 轻微上浮，
  // 物理含义 —— 手指悬停时表面"预压"，元素仍浮于原位
  @media (hover: hover) {
    &:not(.nm-select--disabled):not(.nm-select--focused):not(.nm-select--open):hover {
      box-shadow:
        inset 5px 5px 10px var(--nm-shadow-dark),
        inset -5px -5px 10px var(--nm-shadow-light);
      transform: translateY(-1px);
    }
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--focused,
  &--open {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark),
      inset -5px -5px 10px var(--nm-shadow-light),
      0 0 0 3px var(--nm-primary-color);
  }

  &--error {
    box-shadow:
      inset 4px 4px 8px var(--nm-shadow-dark),
      inset -4px -4px 8px var(--nm-shadow-light),
      0 0 0 2px var(--nm-color-error);

    // 错误态聚焦时外环跟随错误色（与 NeumorphismInput 行为对齐）
    &.nm-select--focused,
    &.nm-select--open {
      box-shadow:
        inset 5px 5px 10px var(--nm-shadow-dark),
        inset -5px -5px 10px var(--nm-shadow-light),
        0 0 0 3px var(--nm-color-error);
    }
  }

  &--multiple {
    flex-wrap: wrap;
    height: auto;
    padding-top: var(--nm-field-padding-y-sm);
    padding-bottom: var(--nm-field-padding-y-sm);
    // 注意：不要在此设 row-gap —— 标签换行间距由 .nm-select__tags 自身的
    // gap 承担；盒级 row-gap 在 outlined（column 布局）下会作用于
    // face 与下拉两行之间，产生 4px 接缝，破坏"连体"构造
  }
}

.nm-select__value {
  flex: 1;
  font-size: var(--nm-font-base);
  color: var(--nm-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &--placeholder {
    color: var(--nm-text-placeholder);
  }
}

.nm-select__tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--nm-spacing-xs);
  flex: 1 1 auto;
  min-width: 0;
}

.nm-select__tag-collapse {
  flex-shrink: 0;
}

.nm-select__input {
  flex: 1;
  min-width: 56px;
  padding: 0;
  border: none;
  background: transparent;
  outline: none;
  font: inherit;
  font-size: var(--nm-font-base);
  color: var(--nm-text-primary);
  cursor: pointer;

  .nm-select--open &,
  .nm-select--multiple & {
    cursor: text;
  }

  &::placeholder {
    color: var(--nm-text-placeholder);
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.nm-select__actions {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-xs);
  flex-shrink: 0;
  margin-left: auto;
}

.nm-select__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--nm-text-secondary);
  border-radius: var(--nm-border-radius-full);
  transition: color var(--nm-transition-fast);
  &:hover {
    color: var(--nm-text-primary);
  }
  &:focus-visible {
    outline: 2px solid var(--nm-primary-color);
    outline-offset: 1px;
  }
}

.nm-select__spinner {
  color: var(--nm-primary-color);
  animation: nm-spin 0.8s linear infinite;
}

.nm-select__arrow {
  color: var(--nm-text-secondary);
  transition: transform var(--nm-transition-fast);
  &--open {
    transform: rotate(180deg);
  }
}

.nm-select__dropdown {
  // inline width 取自触发器视觉宽度（getBoundingClientRect），必须用
  // border-box 才能让下拉实际视觉宽度与之对齐 —— 否则 content-box 下
  // border + padding 会让下拉左右各凸出，连体拼接时尤为明显
  box-sizing: border-box;
  z-index: var(--nm-z-dropdown);
  max-height: var(--nm-select-dropdown-max-height);
  overflow-y: auto;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-raised(4px, 12px);
  @include nm-theme-transition;
  padding: var(--nm-spacing-xs);
}

.nm-select__group-title {
  padding: var(--nm-spacing-xs) var(--nm-select-option-padding-x);
  font-size: var(--nm-font-xs);
  font-weight: var(--nm-font-weight-medium);
  color: var(--nm-text-placeholder);
  letter-spacing: 0.02em;
  user-select: none;

  &:not(:first-child) {
    margin-top: var(--nm-spacing-xs);
    border-top: 1px solid var(--nm-border-subtle);
    padding-top: var(--nm-spacing-sm);
  }
}

.nm-select__option {
  display: flex;
  align-items: center;
  gap: var(--nm-spacing-sm);
  padding: var(--nm-select-option-padding-y) var(--nm-select-option-padding-x);
  font-size: var(--nm-select-option-font);
  color: var(--nm-text-primary);
  border-radius: var(--nm-border-radius-sm);
  cursor: pointer;
  transition:
    background-color 0.25s $nm-ease-ambient,
    transform 0.2s $nm-ease-spring,
    box-shadow 0.25s $nm-ease-ambient;
  position: relative;

  &:hover:not(&--disabled):not(&--empty) {
    background-color: var(--nm-select-option-hover-bg);
    transform: translateX(3px);
    box-shadow:
      inset 1px 1px 2px var(--nm-shadow-dark),
      inset -1px -1px 2px var(--nm-shadow-light);
  }

  // 多选键盘高亮项 —— 视觉与 hover 等价
  &--active:not(&--disabled) {
    background-color: var(--nm-select-option-hover-bg);
    box-shadow:
      inset 1px 1px 2px var(--nm-shadow-dark),
      inset -1px -1px 2px var(--nm-shadow-light);
  }

  // 选中 = 陷入表面（物理隐喻：已确认的选项被"按进"底板）
  &--selected:not(&--disabled) {
    color: var(--nm-primary-color);
    font-weight: 600;
    background-color: var(--nm-select-option-hover-bg);
    box-shadow:
      inset 2px 2px 5px var(--nm-shadow-dark),
      inset -2px -2px 5px var(--nm-shadow-light);
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--empty {
    color: var(--nm-text-placeholder);
    cursor: default;
  }
}

// 单选选中指示点（多选改用前置勾选框）
.nm-select__dropdown:not(.nm-select__dropdown--multiple) .nm-select__option--selected::after {
  content: '';
  position: absolute;
  right: 12px;
  width: 6px;
  height: 6px;
  border-radius: var(--nm-border-radius-full);
  background-color: var(--nm-primary-color);
  box-shadow: 0 0 6px color-mix(in srgb, var(--nm-primary-color) 40%, transparent);
  animation: nm-select-dot-pop 0.35s $nm-ease-bounce;
}

// ==========================================
// Outlined 变体 — 描边扁平 + 单盒纵向延展
// 与 default（新拟态凹陷 + teleport 浮层）形成对照：触发器盒体本身就是
// 容器，下拉是盒内第二行；展开时盒体随下拉的 max-height 过渡自然长高，
// 负 margin 同参补偿布局。单盒只有一个边框、一圈发光、一个投影 ——
// 接缝从构造上不存在。所有视觉参数走 Token。
// ==========================================

// 触发器（即单盒本体）
.nm-select--outlined {
  flex-direction: column;
  align-items: stretch;
  // 闭合时 face 在盒内垂直居中
  justify-content: center;
  background-color: var(--nm-select-outlined-bg);
  border: 2px solid var(--nm-select-outlined-border-color);
  border-radius: var(--nm-select-outlined-radius);
  // 用边框替代 inset 浮雕
  box-shadow: none;

  @media (hover: hover) {
    &:not(.nm-select--disabled):not(.nm-select--focused):not(.nm-select--open):hover {
      border-color: var(--nm-select-outlined-focus-border-color);
      transform: none;
      box-shadow: none;
    }
  }

  // focus（未展开）：完整外发光环 + 主色描边
  &.nm-select--focused:not(.nm-select--glowing) {
    border-color: var(--nm-select-outlined-focus-border-color);
    box-shadow: 0 0 0 3px var(--nm-select-outlined-focus-glow);
  }

  // open（visualOpen 保持到收起动画结束）：层叠提升 + 描边点亮
  &.nm-select--open {
    z-index: var(--nm-z-dropdown);
    border-color: var(--nm-select-outlined-focus-border-color);
  }

  // glowing（isOpen 驱动）：整圈发光 + 投影随盒体一同生长/收缩，
  // 与面板动画并发（展开淡入、收起同步淡出）
  &.nm-select--glowing {
    box-shadow:
      0 0 0 3px var(--nm-select-outlined-focus-glow),
      var(--nm-select-outlined-dropdown-shadow);

    &.nm-select--drop-up {
      box-shadow:
        0 0 0 3px var(--nm-select-outlined-focus-glow),
        var(--nm-select-outlined-dropdown-shadow-up);
    }
  }

  // 向上翻转：下拉行换到 face 上方（配合负 margin-top 补偿，盒体向上延展）
  &.nm-select--drop-up {
    flex-direction: column-reverse;
  }

  // error：错误色描边 + 错误发光
  &.nm-select--error {
    border-color: var(--nm-color-error);

    &.nm-select--focused:not(.nm-select--glowing) {
      border-color: var(--nm-color-error);
      box-shadow: 0 0 0 3px var(--nm-shadow-error);
    }

    &.nm-select--open {
      border-color: var(--nm-color-error);
    }

    &.nm-select--glowing {
      box-shadow:
        0 0 0 3px var(--nm-shadow-error),
        var(--nm-select-outlined-dropdown-shadow);

      &.nm-select--drop-up {
        box-shadow:
          0 0 0 3px var(--nm-shadow-error),
          var(--nm-select-outlined-dropdown-shadow-up);
      }
    }
  }
}

// 下拉面板（盒内第二行）—— 无边框/圆角/投影/独立定位，
// 仅作为可伸缩高度区域；揭示动画由 max-height 过渡驱动，
// 盒体随内容自然长高（移动的圆角底边即盒体自身底边，物理延展）
.nm-select__dropdown--outlined {
  max-height: 0;
  overflow: hidden;
  background-color: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  z-index: auto;
  // border-box 下 padding 不被 max-height:0 压缩 —— 展开首帧/收起末帧会
  // 残留一条 8px 细条（露出被截断的选项文字）。纵向间距改由伪元素占位，
  // 在盒内随 max-height→0 一起被裁掉；横向 padding 保留
  padding: 0 var(--nm-spacing-xs);
  &::before,
  &::after {
    content: '';
    display: block;
    height: var(--nm-spacing-xs);
  }
  // 稳态高度调整（滚动/过滤改变可用空间或内容时）与展开同参缓动
  transition: max-height 0.34s $nm-ease-pull;

  // 展开动画结束（--settled）后放开内部滚动；动画期间 hidden 防滚动条闪烁
  .nm-select--settled & {
    overflow-y: auto;
  }

  // 选项：扁平交互（去位移 / 去凹陷）
  .nm-select__option:hover:not(.nm-select__option--disabled):not(.nm-select__option--empty) {
    background-color: var(--nm-select-outlined-option-hover-bg);
    transform: none;
    box-shadow: none;
  }
  .nm-select__option--active:not(.nm-select__option--disabled) {
    background-color: var(--nm-select-outlined-option-hover-bg);
    box-shadow: none;
  }
  // 选中：去凹陷、去背景，仅靠主色文字加粗 + 指示点标识（贴近 headless demo）
  .nm-select__option--selected:not(.nm-select__option--disabled) {
    background-color: transparent;
    box-shadow: none;
  }
  // 单选选中指示点移到左侧
  &:not(.nm-select__dropdown--multiple) .nm-select__option--selected::after {
    right: auto;
    left: 12px;
  }
  // 左侧指示点预留空间，避免压字
  .nm-select__option {
    padding-left: calc(var(--nm-select-option-padding-x) + 16px);
  }
}

.nm-select__checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border-radius: var(--nm-border-radius-xs);
  color: var(--nm-text-on-primary);
  // 未选中 = 表面上的凹槽
  box-shadow:
    inset 1px 1px 3px var(--nm-shadow-dark),
    inset -1px -1px 3px var(--nm-shadow-light);
  transition:
    background-color 0.2s $nm-ease-ambient,
    box-shadow 0.2s $nm-ease-ambient;

  // 选中 = 凹槽被"填充"为主体色
  &--checked {
    background-color: var(--nm-primary-color);
    box-shadow:
      inset 1px 1px 2px color-mix(in srgb, var(--nm-primary-color) 60%, #000 40%),
      0 0 6px color-mix(in srgb, var(--nm-primary-color) 40%, transparent);
  }
}

.nm-select__option-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nm-select__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--nm-spacing-sm);
  padding: var(--nm-select-option-padding-y) var(--nm-select-option-padding-x);
  font-size: var(--nm-font-base);
  color: var(--nm-text-secondary);
}

.nm-select__loading-icon {
  color: var(--nm-primary-color);
  animation: nm-spin 0.8s linear infinite;
  flex-shrink: 0;
}

.nm-select__empty {
  flex-direction: column;
  justify-content: center;
  gap: var(--nm-spacing-sm);
  padding: var(--nm-spacing-lg) var(--nm-select-option-padding-x);
  text-align: center;
}

.nm-select__empty-icon {
  color: var(--nm-text-placeholder);
  opacity: 0.7;
}

// Sizes
.nm-select--small {
  min-height: var(--nm-field-min-height-sm);
  padding: var(--nm-field-padding-y-sm) var(--nm-field-padding-x-sm);
  .nm-select__value,
  .nm-select__input {
    font-size: var(--nm-field-font-sm);
  }
  .nm-select__arrow {
    width: 14px;
    height: 14px;
  }
}

.nm-select--medium {
  min-height: var(--nm-field-min-height-md);
  padding: var(--nm-field-padding-y-md) var(--nm-field-padding-x-md);
}

.nm-select--large {
  min-height: var(--nm-field-min-height-lg);
  padding: var(--nm-field-padding-y-lg) var(--nm-field-padding-x-lg);
  .nm-select__value,
  .nm-select__input {
    font-size: var(--nm-field-font-lg);
  }
  .nm-select__arrow {
    width: 18px;
    height: 18px;
  }
}

// 多选触发器允许内容增高（标签换行），min-height 仍由尺寸档控制
.nm-select--multiple {
  &.nm-select--small,
  &.nm-select--medium,
  &.nm-select--large {
    height: auto;
  }
}

// Dropdown transition
.nm-select-dropdown-enter-active {
  transition:
    opacity 0.25s $nm-ease-decelerate,
    transform 0.25s $nm-ease-spring;
}
.nm-select-dropdown-leave-active {
  transition:
    opacity 0.15s $nm-ease-accelerate,
    transform 0.15s $nm-ease-accelerate;
}
.nm-select-dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
.nm-select-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
// 向上翻转展开时，进入/离开方向随之反转
.nm-select__dropdown--up.nm-select-dropdown-enter-from {
  transform: translateY(8px) scale(0.98);
}
.nm-select__dropdown--up.nm-select-dropdown-leave-to {
  transform: translateY(4px) scale(0.98);
}

// ==========================================
// Outlined 延展动效 —— 单盒模型：下拉区域的高度过渡即盒体的长高。
// 进入：max-height 0 → 自然值（0.34s $nm-ease-pull 先快后慢）；
// 离开：反向 0.3s 加速收没。盒体负 margin 以相同参数同步补偿，布局零抖动；
// 发光/投影随盒体一同生长。向上翻转由盒体 column-reverse 承担，
// 高度动画本身与方向无关（opacity/transform 仅用于覆盖通用过渡的同名声明）。
// ==========================================
.nm-select__dropdown--outlined.nm-select-dropdown-enter-active {
  transition: max-height 0.34s $nm-ease-pull;
}
.nm-select__dropdown--outlined.nm-select-dropdown-leave-active {
  transition: max-height 0.3s $nm-ease-accelerate;
}
.nm-select__dropdown--outlined.nm-select-dropdown-enter-from,
.nm-select__dropdown--outlined.nm-select-dropdown-leave-to {
  opacity: 1;
  transform: none;
  max-height: 0 !important;
}

@keyframes nm-select-dot-pop {
  0% {
    transform: scale(0);
  }
  70% {
    transform: scale(1.4);
  }
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-select {
    transition: none;
  }
  .nm-select__option {
    transition: none;
  }
  .nm-select__option--selected::after {
    animation: none;
  }
  .nm-select__spinner,
  .nm-select__loading-icon {
    animation: none;
  }
  .nm-select-dropdown-enter-active,
  .nm-select-dropdown-leave-active {
    transition: none;
  }
}
</style>
