<script setup lang="ts">
import { computed, ref, watch, useAttrs } from 'vue'
import { useCheckable } from '@/composables/useCheckable'

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
  size: 'medium',
  indeterminate: false,
})

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
  size: props.size,
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
        <svg v-if="indeterminate" class="nm-checkbox__icon" viewBox="0 0 24 24" fill="none">
          <path d="M5 12H19" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        <svg v-else-if="isChecked" class="nm-checkbox__icon" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
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

// Checkbox-specific
.nm-checkbox__box {
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

// Ripple burst on check
.nm-checkbox__box::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
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
    inset 1px 1px 2px rgba(0, 0, 0, 0.2),
    inset -1px -1px 2px rgba(255, 255, 255, 0.2);
}

.nm-checkbox__icon {
  width: 65%;
  height: 65%;
  color: #fff;
  transform: scale(0);
  transition: transform 0.35s $nm-ease-bounce;
}

.nm-checkbox--checked .nm-checkbox__icon,
.nm-checkbox--indeterminate .nm-checkbox__icon {
  transform: scale(1);
}

// Hover physics on the label area
.nm-checkbox:not(.nm-checkbox--disabled):hover .nm-checkbox__box {
  box-shadow:
    inset 3px 3px 6px var(--nm-shadow-dark),
    inset -3px -3px 6px var(--nm-shadow-light);
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
