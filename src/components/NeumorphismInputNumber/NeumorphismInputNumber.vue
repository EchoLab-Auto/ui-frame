<script setup lang="ts">
import { computed } from 'vue'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import { useNumberInput } from '@/composables/useNumberInput'
import NeumorphismFieldLabel from '@/components/NeumorphismField/NeumorphismFieldLabel.vue'

defineOptions({ inheritAttrs: false })

export type NumberInputSize = 'small' | 'medium' | 'large'

export interface NeumorphismInputNumberProps {
  /** v-model binding — current number value */
  modelValue?: number
  /** Minimum allowed value */
  min?: number
  /** Maximum allowed value */
  max?: number
  /** Step increment for up/down */
  step?: number
  /** Decimal precision */
  precision?: number
  /** Whether the input is disabled */
  disabled?: boolean
  /** Size variant */
  size?: NumberInputSize
  /** Placeholder text */
  placeholder?: string
  /** Show increment/decrement buttons */
  controls?: boolean
  /** Label text */
  label?: string
}

const props = withDefaults(defineProps<NeumorphismInputNumberProps>(), {
  modelValue: undefined,
  min: undefined,
  max: undefined,
  step: 1,
  precision: undefined,
  disabled: false,
  size: 'medium',
  placeholder: '',
  controls: true,
  label: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | undefined): void
  (e: 'change', value: number | undefined): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
}>()

const { config, resolveProp } = useNeumorphismSetup()

// Resolve size via cascade: explicit prop > global config > hardcoded default
const resolvedSize = computed<NumberInputSize>(() =>
  resolveProp(props.size, config.value.input?.size as NumberInputSize | undefined, 'medium')
)

// Resolve disabled
const disabledRef = computed(() => props.disabled)

// ==========================================
// Number input composable (headless logic)
// ==========================================

const modelValueRef = computed({
  get: () => props.modelValue,
  set: val => {
    emit('update:modelValue', val)
    emit('change', val)
  },
})

const { displayValue, increment, decrement, handleInput, handleKeydown, handleBlur } =
  useNumberInput({
    modelValue: modelValueRef,
    min: props.min,
    max: props.max,
    step: props.step,
    precision: props.precision,
    disabled: disabledRef,
  })

// ==========================================
// CSS class list
// ==========================================

const classList = computed(() => [
  'nm-input-number',
  `nm-input-number--${resolvedSize.value}`,
  {
    'nm-input-number--disabled': props.disabled,
    'nm-input-number--has-controls': props.controls,
  },
])

// ==========================================
// Blur handler (delegate to composable + emit)
// ==========================================

function onBlur(event: FocusEvent): void {
  handleBlur()
  emit('blur', event)
}

function onFocus(event: FocusEvent): void {
  emit('focus', event)
}
</script>

<template>
  <div :class="classList">
    <NeumorphismFieldLabel :label="label" :for-id="undefined" />

    <div class="nm-input-number__body">
      <!-- Decrement button -->
      <button
        v-if="controls"
        type="button"
        class="nm-input-number__btn nm-input-number__btn--decrement"
        :disabled="disabled"
        :aria-label="'Decrement'"
        tabindex="-1"
        @pointerdown.prevent="decrement"
        @dblclick.prevent
      >
        <span class="nm-input-number__btn-icon">−</span>
      </button>

      <!-- Input field -->
      <div class="nm-input-number__input-wrapper">
        <input
          type="text"
          inputmode="decimal"
          class="nm-input-number__input"
          :value="displayValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :aria-disabled="disabled || undefined"
          @input="handleInput"
          @keydown="handleKeydown"
          @blur="onBlur"
          @focus="onFocus"
        />
      </div>

      <!-- Increment button -->
      <button
        v-if="controls"
        type="button"
        class="nm-input-number__btn nm-input-number__btn--increment"
        :disabled="disabled"
        :aria-label="'Increment'"
        tabindex="-1"
        @pointerdown.prevent="increment"
        @dblclick.prevent
      >
        <span class="nm-input-number__btn-icon">+</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

// ==========================================
// Physics Constants
// ==========================================
$number-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
$number-compress: cubic-bezier(0.4, 0, 0.2, 1);
$number-ambient: cubic-bezier(0.4, 0, 0.2, 1);

// ==========================================
// Wrapper
// ==========================================
.nm-input-number {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-sm);
  width: 100%;
}

// ==========================================
// Body (input + buttons)
// ==========================================
.nm-input-number__body {
  display: flex;
  align-items: stretch;
  width: 100%;
  border-radius: var(--nm-border-radius-md);
  overflow: hidden;
}

// ==========================================
// Input wrapper
// ==========================================
.nm-input-number__input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: var(--nm-surface-color);
  min-width: 0;
  @include nm-inset(4px, 8px);
  transition:
    box-shadow 0.35s $number-spring,
    background-color 0.3s $number-ambient;

  &:focus-within {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark),
      inset -5px -5px 10px var(--nm-shadow-light),
      0 0 0 3px var(--nm-primary-color);
    transition:
      box-shadow 0.3s $number-spring,
      background-color 0.3s $number-ambient;
  }
}

// ==========================================
// Input field
// ==========================================
.nm-input-number__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--nm-text-primary);
  font-family: inherit;
  font-size: var(--nm-font-base);
  width: 100%;
  text-align: center;
  min-width: 0;

  &::placeholder {
    color: var(--nm-text-placeholder);
  }

  &:disabled {
    cursor: not-allowed;
    color: var(--nm-text-disabled);
  }
}

// ==========================================
// Buttons (increment / decrement)
// ==========================================
.nm-input-number__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  background-color: var(--nm-surface-color);
  color: var(--nm-text-primary);
  flex-shrink: 0;
  @include nm-raised(3px, 6px);
  transition:
    box-shadow 0.35s $number-spring,
    transform 0.25s $number-compress,
    background-color 0.3s $number-ambient,
    color 0.2s $number-ambient;

  &:hover:not(:disabled) {
    color: var(--nm-primary-color);
    transform: translateY(-1px);
    box-shadow:
      4px 4px 8px var(--nm-shadow-dark),
      -4px -4px 8px var(--nm-shadow-light);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
    @include nm-inset(3px, 6px);
    transition:
      box-shadow 0.12s $number-compress,
      transform 0.12s $number-compress;
    color: var(--nm-primary-dark);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    box-shadow: none;
  }
}

.nm-input-number__btn--decrement {
  border-radius: var(--nm-border-radius-md) 0 0 var(--nm-border-radius-md);
}

.nm-input-number__btn--increment {
  border-radius: 0 var(--nm-border-radius-md) var(--nm-border-radius-md) 0;
}

.nm-input-number__btn-icon {
  font-size: var(--nm-font-lg);
  font-weight: 600;
  line-height: 1;
  user-select: none;
  pointer-events: none;
}

// ==========================================
// Disabled state
// ==========================================
.nm-input-number--disabled {
  .nm-input-number__input-wrapper {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .nm-input-number__input {
    cursor: not-allowed;
  }
}

// ==========================================
// Size variants
// ==========================================
.nm-input-number--small {
  .nm-input-number__input-wrapper {
    min-height: var(--nm-field-min-height-sm);
  }

  .nm-input-number__input {
    padding: var(--nm-field-padding-y-sm) var(--nm-field-padding-x-sm);
    font-size: var(--nm-field-font-sm);
  }

  .nm-input-number__btn {
    width: var(--nm-field-min-height-sm);
  }

  .nm-input-number__btn-icon {
    font-size: var(--nm-font-sm);
  }
}

.nm-input-number--medium {
  .nm-input-number__input-wrapper {
    min-height: var(--nm-field-min-height-md);
  }

  .nm-input-number__input {
    padding: var(--nm-field-padding-y-md) var(--nm-field-padding-x-md);
    font-size: var(--nm-field-font-md);
  }

  .nm-input-number__btn {
    width: var(--nm-field-min-height-md);
  }

  .nm-input-number__btn-icon {
    font-size: var(--nm-font-lg);
  }
}

.nm-input-number--large {
  .nm-input-number__input-wrapper {
    min-height: var(--nm-field-min-height-lg);
  }

  .nm-input-number__input {
    padding: var(--nm-field-padding-y-lg) var(--nm-field-padding-x-lg);
    font-size: var(--nm-field-font-lg);
  }

  .nm-input-number__btn {
    width: var(--nm-field-min-height-lg);
  }

  .nm-input-number__btn-icon {
    font-size: var(--nm-font-xl);
  }
}

// ==========================================
// Reduced motion
// ==========================================
@media (prefers-reduced-motion: reduce) {
  .nm-input-number__input-wrapper,
  .nm-input-number__btn {
    transition: none !important;
    animation: none !important;
  }

  .nm-input-number__btn:hover:not(:disabled) {
    transform: none;
  }

  .nm-input-number__btn:active:not(:disabled) {
    transform: none;
  }
}
</style>
