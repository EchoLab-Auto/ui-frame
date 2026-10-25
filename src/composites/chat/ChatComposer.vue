<script setup lang="ts">
import { computed, ref } from 'vue'
import NeumorphismTextarea from '@/components/NeumorphismTextarea/NeumorphismTextarea.vue'
import NeumorphismButton from '@/components/NeumorphismButton/NeumorphismButton.vue'
import { useLocale } from '@/composables/useLocale'
import { useChatInput } from '@/composables/useChatInput'
import { glassClassNames, normalizeGlass, type GlassValue, type GlassVariant } from '@/utils/glass'

/**
 * 聚焦（选中）特效。
 *
 * 全部落在**输入槽**上——输入器的视觉主体是那个凹陷槽，特效贴着它才读得懂：
 *   - `ring`  外侧主色光环（历史默认，零变化）
 *   - `glow`  **内辉光**：主色光从凹槽内部亮起来（独立的 screen 加法光层，非彩色阴影）
 *   - `inset` 纯新拟态语汇：只是把凹陷加深，不带彩色
 *   - `none`  不施加任何装饰性特效（保留输入框自身的基础凹陷加深，别让聚焦完全不可见）
 */
export type ChatComposerFocusEffect = 'ring' | 'glow' | 'inset' | 'none'

export interface ChatComposerProps {
  /** 输入内容（v-model） */
  modelValue?: string
  /** 禁用态（如未连接），禁止输入与提交 */
  disabled?: boolean
  /** 占位文本（默认取 locale chatInputPlaceholder） */
  placeholder?: string
  /** 是否显示"取消任务"按钮 */
  cancelable?: boolean
  /** 发送按钮文本（默认取 locale chatSend） */
  sendLabel?: string
  /** 取消按钮文本（默认取 locale chatCancel） */
  cancelLabel?: string
  /** 初始行数 */
  rows?: number | string
  /** 随内容自动增高 */
  autoResize?: boolean
  /** 最大输入长度 */
  maxlength?: number | string
  /**
   * 玻璃拟态档位（与按钮 / 卡片同一套命名）：
   *   - `true` / `'float'` — 悬浮磨砂托盘（环境投影）
   *   - `'raised'`         — 磨砂托盘 + 新拟态凸起双阴影
   *   - `'pressed'`        — 磨砂托盘 + 凹陷内阴影
   *
   * 材质挂在**外壳**上（浮起的玻璃托盘），内部输入槽保持凹陷——
   * 层次是「玻璃托盘 > 凹陷输入槽」，而不是让输入框自己半透明。
   */
  glass?: GlassValue
  /** 聚焦（选中）特效，见 `ChatComposerFocusEffect` */
  focusEffect?: ChatComposerFocusEffect
}

const props = withDefaults(defineProps<ChatComposerProps>(), {
  modelValue: '',
  disabled: false,
  placeholder: '',
  cancelable: false,
  sendLabel: '',
  cancelLabel: '',
  rows: 3,
  autoResize: true,
  maxlength: undefined,
  glass: undefined,
  focusEffect: 'ring',
})

export type ChatComposerEmits = {
  (e: 'update:modelValue', value: string): void
  /** 提交（内容为 trim 后的非空字符串；IME 组合中的 Enter 不会触发） */
  (e: 'send', content: string): void
  /** 点击"取消任务" */
  (e: 'cancel'): void
}

const emit = defineEmits<ChatComposerEmits>()

const { t } = useLocale()

const resolvedPlaceholder = computed(() => props.placeholder || t('chatInputPlaceholder'))
const resolvedSendLabel = computed(() => props.sendLabel || t('chatSend'))
const resolvedCancelLabel = computed(() => props.cancelLabel || t('chatCancel'))

/** 玻璃档位：`true` 归一为 `float`（与按钮 / 卡片同一套归一逻辑） */
const resolvedGlass = computed<GlassVariant | false>(() => normalizeGlass(props.glass))

/**
 * 生效的聚焦特效。
 *
 * 运行时防御一手非法值（属性可能来自外部 JSON 配置）：未知值回落到 `ring`。
 */
const resolvedFocusEffect = computed<ChatComposerFocusEffect>(() => {
  const value = props.focusEffect
  const allowed: ChatComposerFocusEffect[] = ['ring', 'glow', 'inset', 'none']
  return allowed.includes(value) ? value : 'ring'
})

/**
 * 壳内是否持有焦点。
 *
 * 聚焦特效作用于整个输入器（而不是孤立地只看 textarea）：光标在发送钮上
 * 也算"这个输入器正在被使用"，壳上挂 `--focused` 后由样式分发到各档特效。
 */
const focused = ref(false)

function onFocusIn(): void {
  focused.value = true
}

function onFocusOut(event: FocusEvent): void {
  // 焦点在壳内元素之间转移（textarea ↔ 按钮）不算失焦
  const next = event.relatedTarget as Node | null
  const shell = event.currentTarget as HTMLElement | null
  if (next && shell?.contains(next)) return
  focused.value = false
}

const classList = computed(() => [
  'nm-chat-composer',
  `nm-chat-composer--focus-${resolvedFocusEffect.value}`,
  ...glassClassNames('nm-chat-composer', resolvedGlass.value),
  {
    'nm-chat-composer--disabled': props.disabled,
    'nm-chat-composer--glassed': !!resolvedGlass.value,
    'nm-chat-composer--focused': focused.value,
  },
])

const inputRef = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const { handleKeydown, submit, canSubmit } = useChatInput({
  modelValue: inputRef,
  disabled: computed(() => props.disabled),
  onSubmit: content => emit('send', content),
})
</script>

<template>
  <div :class="classList" @focusin="onFocusIn" @focusout="onFocusOut">
    <div v-if="$slots.meta || cancelable" class="nm-chat-composer__meta">
      <slot name="meta" />
      <NeumorphismButton
        v-if="cancelable"
        class="nm-chat-composer__cancel"
        size="small"
        :disabled="disabled"
        @click="emit('cancel')"
      >
        {{ resolvedCancelLabel }}
      </NeumorphismButton>
    </div>
    <div class="nm-chat-composer__row">
      <NeumorphismTextarea
        class="nm-chat-composer__field"
        :model-value="modelValue"
        :placeholder="resolvedPlaceholder"
        :disabled="disabled"
        :rows="rows"
        :auto-resize="autoResize"
        :maxlength="maxlength"
        @update:model-value="emit('update:modelValue', $event)"
        @keydown="handleKeydown"
      />
      <!-- actions 插槽可整体替换默认发送按钮 -->
      <slot name="actions" :submit="submit" :can-submit="canSubmit">
        <NeumorphismButton
          class="nm-chat-composer__send"
          variant="raised"
          shape="pill"
          :disabled="disabled || !canSubmit"
          @click="submit"
        >
          {{ resolvedSendLabel }}
        </NeumorphismButton>
      </slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-chat-composer {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-xs);
  padding: var(--nm-spacing-10) var(--nm-spacing-md) var(--nm-spacing-md);
  border-radius: var(--nm-border-radius-lg);

  // ---- 辉光色板（`focusEffect="glow"` 用）----
  // 「光」的颜色必须**比槽面更亮**：亮色主题的槽面已接近白（--nm-surface-color ≈ #e0e0e0），
  // 主色 #cdfa4e 蓝通道很低，直接混上去会把蓝压下去、净亮度几乎不变（实测 ΔL ≈ +0.2/255），
  // 观感是"染色"而不是"发光"。所以亮色主题先把主色与白混合，得到亮度高于槽面的光色。
  --nm-composer-glow-core: color-mix(in srgb, var(--nm-primary-color) 60%, #fff);
  --nm-composer-glow-halo: color-mix(in srgb, var(--nm-primary-color) 45%, #fff);
  --nm-composer-glow-core-alpha: 85%;
  --nm-composer-glow-halo-alpha: 40%;
  --nm-composer-glow-tray-alpha: 42%;
  // 只有背景/阴影需要过渡；布局属性不动，避免输入时抖动
  transition:
    background-color var(--nm-transition-slow),
    box-shadow var(--nm-transition-slow);
}

.nm-chat-composer__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--nm-spacing-sm);
  min-height: 22px;
  font-size: var(--nm-font-xs);
  color: var(--nm-text-placeholder);
}

.nm-chat-composer__cancel {
  margin-left: auto;
}

.nm-chat-composer__row {
  display: flex;
  align-items: flex-end;
  gap: var(--nm-spacing-sm);
}

.nm-chat-composer__field {
  flex: 1;
  min-width: 0;
}

// 发送按钮：主色胶囊 —— 会话区唯一的强视觉焦点
// （与 .nm-button 同元素，用双类名提升特异性压过组件自身的 variant 背景）
.nm-chat-composer__send.nm-button {
  flex-shrink: 0;
  background-color: var(--nm-primary-color);
  color: var(--nm-text-on-primary);
  font-weight: 600;

  &:disabled {
    background-color: var(--nm-surface-color);
    color: var(--nm-text-disabled);
    font-weight: 400;
  }
}

// 暗色主题 headroom 很大（槽面 #1c1c1c），纯主色才是"霓虹"；白化反而发灰。
[data-theme='dark'] .nm-chat-composer,
.nm-theme-dark .nm-chat-composer {
  --nm-composer-glow-core: var(--nm-primary-color);
  --nm-composer-glow-halo: var(--nm-primary-color);
  --nm-composer-glow-core-alpha: 34%;
  --nm-composer-glow-halo-alpha: 18%;
  --nm-composer-glow-tray-alpha: 26%;
}

// ============================================================
//  玻璃拟态
//
//  材质挂在**外壳**上：输入器作为一个整体单元呈现在会话区，层次是
//  「浮起的玻璃托盘 > 里面的凹陷输入槽」。内部 textarea 在玻璃模式下
//  改为半透明底色，让托盘的通透材质透上来（不在 textarea 上再叠一层
//  backdrop-filter——嵌套模糊既贵又会糊掉文字边缘）。
// ============================================================
/// 半透明表面上的 1px 高光边（内描边：贴合圆角、不占布局）
@function nm-composer-glass-edge() {
  @return inset 0 0 0 1px
    color-mix(
      in srgb,
      var(--nm-shadow-light) calc(var(--nm-glass-border-opacity) * 100%),
      transparent
    );
}

.nm-chat-composer--glass {
  background: var(--nm-glass-bg);
  backdrop-filter: blur(var(--nm-glass-blur)) saturate(1.15);
  -webkit-backdrop-filter: blur(var(--nm-glass-blur)) saturate(1.15);
  isolation: isolate;
  box-shadow: nm-composer-glass-edge();
}

// 不支持 backdrop-filter 时退回近不透明表面色，保证文字可读
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .nm-chat-composer--glass {
    background: color-mix(in srgb, var(--nm-surface-color) 94%, transparent);
  }
}

// ---------- float — 悬浮磨砂托盘 ----------
// 档位阴影放进自定义属性：聚焦辉光要在**不丢档位物理**的前提下叠加一层光晕，
// 而 box-shadow 只能整条声明覆盖，所以拆成「档位阴影 var + 高光边 + 可变晕层」。
.nm-chat-composer--glass.nm-chat-composer--glass-float {
  --nm-composer-tier-shadow:
    0 8px 24px var(--nm-shadow-ambient-lg),
    0 2px 6px color-mix(in srgb, var(--nm-shadow-dark) 25%, transparent);
  box-shadow: nm-composer-glass-edge(), var(--nm-composer-tier-shadow);
}

// ---------- raised — 磨砂托盘 + 新拟态凸起 ----------
.nm-chat-composer--glass.nm-chat-composer--glass-raised {
  --nm-composer-tier-shadow:
    0 1px 2px var(--nm-shadow-ambient-md), 4px 4px 8px var(--nm-shadow-dark),
    -2px -2px 6px var(--nm-shadow-light);
  box-shadow: nm-composer-glass-edge(), var(--nm-composer-tier-shadow);
}

// ---------- pressed — 磨砂托盘 + 凹陷内阴影 ----------
.nm-chat-composer--glass.nm-chat-composer--glass-pressed {
  --nm-composer-tier-shadow:
    inset 3px 3px 6px var(--nm-shadow-dark-deep), inset -3px -3px 6px var(--nm-shadow-light-deep);
  box-shadow: nm-composer-glass-edge(), var(--nm-composer-tier-shadow);
}

// 玻璃模式下的输入槽：半透明底 + 减弱的内阴影，让托盘材质透上来
.nm-chat-composer--glassed :deep(.nm-textarea) {
  background-color: color-mix(in srgb, var(--nm-bg-color) 55%, transparent);
}

// ============================================================
//  聚焦（选中）特效
//
//  纯新拟态语汇（ring / inset）无需彩色即可读；glow 是唯一带主色的档位。
//  各档统一用「壳状态类 + :deep(输入槽)」双条件选择器，特异性高于
//  textarea 自身的 `--focused` 规则，因此不依赖样式表顺序。
// ============================================================

// ---------- ring（默认）----------
// 保持历史行为：交给 textarea 自己的 `--focused`（外环 + 加深内阴影）。
// 这里显式声明为空规则，作用是让四档在样式表里有对称的落点，便于对照阅读。

// ---------- glow — 内辉光（加法光层）----------
//
// 为什么不用 inset box-shadow 画光（旧实现的教训）：
//   box-shadow 只能做 **色彩合成**（alpha over），数学上永远无法提高亮度。
//   实测旧版把 #cdfa4e 以 34% 混进中性灰槽面：R −11、G +16、B −86，
//   净亮度 ΔL 仅 +0.2/255 —— 人眼读到的是「染色 / 污渍」，不是「发光」；
//   再叠一条 1px 高饱和内描边收边，一个设备像素内 B 通道跳 70 级，读作「霓虹灯管」。
//
// 现方案：把光画在一个独立的 **screen 混合层**上。
//   screen(a,b) = a + b − ab —— 只会变亮、且数学上不可能超过 1（不会过曝）。
//   光层用 z-index: −1 落在「槽背景之上、文字之下」，因此文字对比度不受影响。
//
// 光色分主题：亮色槽面接近白，可加亮余量只有 ~12%，主色必须先白化才高于槽面亮度；
// 暗色 headroom 很大，纯主色才是霓虹。见上方 --nm-composer-glow-* 定义。
.nm-chat-composer--focus-glow :deep(.nm-textarea) {
  position: relative;
  // 让 z-index:-1 的光层留在这个盒子里，并且只与本槽自身的背景混合
  isolation: isolate;
}

.nm-chat-composer--focus-glow :deep(.nm-textarea)::before {
  content: '';
  position: absolute;
  inset: 0;
  // 负 z-index：画在槽背景之上、文字之下（光罩住文字会直接吃掉对比度）
  z-index: -1;
  border-radius: inherit;
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0;
  // 双层半径：6px 近核 + 26px 远晕。
  // 刻意**不用** 1px 实色描边收边 —— 那个硬跳正是「不自然」的主要来源。
  box-shadow:
    inset 0 0 6px
      color-mix(
        in srgb,
        var(--nm-composer-glow-core) var(--nm-composer-glow-core-alpha),
        transparent
      ),
    inset 0 0 26px 2px
      color-mix(
        in srgb,
        var(--nm-composer-glow-halo) var(--nm-composer-glow-halo-alpha),
        transparent
      );
  transition: opacity var(--nm-transition-slow);
}

.nm-chat-composer--focus-glow.nm-chat-composer--focused :deep(.nm-textarea--focused)::before {
  opacity: 1;
}

// 聚焦时保留「凹陷加深」，但去掉默认外环（`ring` 才用外环）：
// 光在独立层里，不必为压掉外环而整条重写 box-shadow。
.nm-chat-composer--focus-glow.nm-chat-composer--focused :deep(.nm-textarea--focused) {
  box-shadow:
    inset 5px 5px 10px var(--nm-shadow-dark),
    inset -5px -5px 10px var(--nm-shadow-light);
}

// glow + 玻璃：托盘自身也被点亮（光在托盘材质内部，同一套 screen 层）。
// 不再用 `0 0 0 1px` 的外环 —— 那是同一个硬边错误的外侧版本。
.nm-chat-composer--glass {
  position: relative;
}

.nm-chat-composer--glass.nm-chat-composer--focus-glow::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0;
  box-shadow: inset 0 0 44px 6px
    color-mix(in srgb, var(--nm-composer-glow-halo) var(--nm-composer-glow-tray-alpha), transparent);
  transition: opacity var(--nm-transition-slow);
}

.nm-chat-composer--glass.nm-chat-composer--focus-glow.nm-chat-composer--focused::after {
  opacity: 1;
}

// 极端降级：浏览器不支持 mix-blend-mode 时，screen 会退化成普通叠加 ——
// 那正是「染色」而非「加光」。此时干脆不用光层，改回外环指示聚焦。
@supports not (mix-blend-mode: screen) {
  .nm-chat-composer--focus-glow.nm-chat-composer--focused :deep(.nm-textarea--focused) {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark),
      inset -5px -5px 10px var(--nm-shadow-light),
      0 0 0 3px var(--nm-primary-color);
  }

  .nm-chat-composer--focus-glow.nm-chat-composer--focused :deep(.nm-textarea--focused)::before {
    opacity: 0;
  }
}

// ---------- inset — 纯加深凹陷（无彩色）----------
.nm-chat-composer--focus-inset.nm-chat-composer--focused :deep(.nm-textarea--focused) {
  box-shadow:
    inset 7px 7px 14px var(--nm-shadow-dark),
    inset -7px -7px 14px var(--nm-shadow-light);
}

// ---------- none — 不加装饰，只保留输入框自身的基础凹陷加深 ----------
// （不给 0 特效：完全看不见聚焦是 a11y 退化；要彻底自绘请覆盖 :focus-visible）
.nm-chat-composer--focus-none.nm-chat-composer--focused :deep(.nm-textarea--focused) {
  box-shadow:
    inset 5px 5px 10px var(--nm-shadow-dark),
    inset -5px -5px 10px var(--nm-shadow-light);
}

// 禁用态：玻璃托盘收敛为不透明表面，避免"禁用却还在发光"
.nm-chat-composer--disabled.nm-chat-composer--glass {
  background: color-mix(in srgb, var(--nm-surface-color) 92%, transparent);
  box-shadow: nm-composer-glass-edge();
  opacity: 0.75;
}

@media (prefers-reduced-motion: reduce) {
  .nm-chat-composer {
    transition: none;
  }
}
</style>
