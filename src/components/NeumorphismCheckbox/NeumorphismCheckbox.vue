<script setup lang="ts">
import { computed, ref, watch, useAttrs } from 'vue'
import { useCheckable } from '@/composables/useCheckable'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import NeumorphismIcon from '@/components/NeumorphismIcon/NeumorphismIcon.vue'

export interface NeumorphismCheckboxProps {
  modelValue?: boolean
  disabled?: boolean
  label?: string
  size?: 'small' | 'medium' | 'large'
  name?: string
  id?: string
  indeterminate?: boolean
}

const props = withDefaults(defineProps<NeumorphismCheckboxProps>(), {
  modelValue: false,
  disabled: false,
  indeterminate: false,
})

const { config, resolveProp } = useNeumorphismSetup()

const resolvedSize = computed(() => resolveProp(props.size, config.value.checkbox?.size, 'medium'))

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}>()

const isChecked = computed({
  get: () => props.modelValue,
  set: value => {
    if (props.disabled) return
    emit('update:modelValue', value)
    emit('change', value)
  },
})

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
const inputRef = ref<HTMLInputElement>()

const inputAttrs = computed(() => {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(attrs)) {
    if (key !== 'class' && key !== 'style') {
      result[key] = attrs[key]
    }
  }
  return result
})

const { inputId, classList } = useCheckable(() => ({
  prefix: 'checkbox',
  isChecked: isChecked.value,
  isDisabled: props.disabled,
  size: resolvedSize.value,
  extraClasses: { 'nm-checkbox--indeterminate': props.indeterminate },
}))

// Sync native indeterminate property for accessibility
watch(
  () => props.indeterminate,
  val => {
    if (inputRef.value) inputRef.value.indeterminate = val
  },
  { immediate: true }
)

function handleChange(event: Event): void {
  if (props.disabled) {
    event.preventDefault()
    return
  }
  isChecked.value = (event.target as HTMLInputElement).checked
}
</script>

<template>
  <label :class="[classList, attrs.class]" :style="attrs.style" :for="inputId">
    <span class="nm-checkbox__input-wrapper">
      <input
        :id="inputId"
        ref="inputRef"
        type="checkbox"
        class="nm-checkbox__input"
        :checked="isChecked"
        :disabled="disabled"
        :name="name"
        v-bind="inputAttrs"
        @change="handleChange"
      />
      <span class="nm-checkbox__box" aria-hidden="true">
        <NeumorphismIcon
          v-if="indeterminate"
          name="minus"
          class="nm-checkbox__icon"
          :stroke-width="3"
        />
        <NeumorphismIcon
          v-else-if="isChecked"
          name="check"
          class="nm-checkbox__icon"
          :stroke-width="3"
        />
      </span>
    </span>
    <span v-if="label || $slots.default" class="nm-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
@use '@/styles/_checkable.scss' as *;

@include checkable-root('checkbox');
@include checkable-input-wrapper('checkbox');
@include checkable-hidden-input('checkbox');
@include checkable-indicator-base('checkbox', 'box');
@include checkable-label('checkbox');
@include checkable-focus-ring('checkbox', 'box');
@include checkable-sizes('checkbox', 'box');

// 勾选图标尺寸档（§8 枚举；box 18/24/30 → icon 12/14/16，视觉占比 67%/58%/53%，
// 与旧 65% 的观感一致但尺寸可枚举、可被 check:icons 校验）
.nm-checkbox--small .nm-checkbox__icon {
  width: var(--nm-icon-size-xs);
  height: var(--nm-icon-size-xs);
}
.nm-checkbox--medium .nm-checkbox__icon {
  width: var(--nm-icon-size-sm);
  height: var(--nm-icon-size-sm);
}
.nm-checkbox--large .nm-checkbox__icon {
  width: var(--nm-icon-size-md);
  height: var(--nm-icon-size-md);
}

// Checkbox-specific
.nm-checkbox__box {
  border-radius: var(--nm-border-radius-sm);
  position: relative;
  overflow: hidden;
}

// Ripple burst on check
.nm-checkbox__box::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    circle at center,
    color-mix(in srgb, var(--nm-text-on-primary) 40%, transparent) 0%,
    transparent 70%
  );
  opacity: 0;
  transform: scale(0);
  transition: none;
}

.nm-checkbox--checked .nm-checkbox__box::after,
.nm-checkbox--indeterminate .nm-checkbox__box::after {
  animation: nm-checkbox-ripple 0.4s $nm-ease-decelerate;
}

.nm-checkbox--checked .nm-checkbox__box,
.nm-checkbox--indeterminate .nm-checkbox__box {
  background-color: var(--nm-primary-color);
  box-shadow:
    inset 1px 1px 2px var(--nm-shadow-dark-strong),
    inset -1px -1px 2px var(--nm-shadow-light-ambient-lg);
}

.nm-checkbox__icon {
  /* 尺寸走 §8 枚举档（2026-10）：此前 `65%` 随 box 缩放，实测 11.7 / 15.6 /
     19.5px——三档全部落在 12/14/16/18/20/24/32 之外，规范无法校验。
     档位在 size 变体里显式给出（small 12 / medium 14 / large 16）。 */
  width: var(--nm-icon-size-xs);
  height: var(--nm-icon-size-xs);
  color: var(--nm-text-on-primary);
  transform: scale(0);
  transition: transform 0.35s $nm-ease-bounce;
}

.nm-checkbox--checked .nm-checkbox__icon,
.nm-checkbox--indeterminate .nm-checkbox__icon {
  transform: scale(1);
}

// Hover physics on the label area
@media (hover: hover) {
  .nm-checkbox:not(.nm-checkbox--disabled):hover .nm-checkbox__box {
    box-shadow:
      inset 3px 3px 6px var(--nm-shadow-dark),
      inset -3px -3px 6px var(--nm-shadow-light);
  }
}

// Active press feedback
.nm-checkbox:not(.nm-checkbox--disabled):active .nm-checkbox__box {
  transform: scale(0.92);
  transition: transform 0.1s $nm-ease-compress;
}

@keyframes nm-checkbox-ripple {
  0% {
    opacity: 0.6;
    transform: scale(0);
  }
  100% {
    opacity: 0;
    transform: scale(2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-checkbox__icon {
    transition: none;
    transform: scale(1);
  }
  .nm-checkbox--checked .nm-checkbox__box::after,
  .nm-checkbox--indeterminate .nm-checkbox__box::after {
    animation: none;
  }
  .nm-checkbox:not(.nm-checkbox--disabled):active .nm-checkbox__box {
    transform: none;
  }
}
</style>
