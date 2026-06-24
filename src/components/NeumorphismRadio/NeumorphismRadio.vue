<script setup lang="ts">
import { computed, inject, useAttrs } from 'vue'
import { useCheckable } from '@/composables/useCheckable'
import { RadioGroupKey } from '@/composables/injectionKeys'
import { useNeumorphismSetup } from '@/extensions/createComponent'

defineOptions({ inheritAttrs: false })

export interface NeumorphismRadioProps {
  modelValue?: unknown
  value: unknown
  disabled?: boolean
  label?: string
  size?: 'small' | 'medium' | 'large'
  name?: string
  id?: string
}

const props = withDefaults(defineProps<NeumorphismRadioProps>(), {
  disabled: false,
  size: 'medium',
})

const { config, resolveProp } = useNeumorphismSetup()

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void
  (e: 'change', value: unknown): void
}>()

const attrs = useAttrs()

const inputAttrs = computed(() => {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(attrs)) {
    if (key !== 'class' && key !== 'style') {
      result[key] = attrs[key]
    }
  }
  return result
})

const radioGroup = inject(RadioGroupKey, null)

const isChecked = computed(() => {
  if (radioGroup) return radioGroup.modelValue.value === props.value
  return props.modelValue === props.value
})

const isDisabled = computed(() => props.disabled || radioGroup?.disabled.value || false)
const resolvedSize = computed<'small' | 'medium' | 'large'>(
  () => resolveProp(props.size, config.value.radio?.size, 'medium') as 'small' | 'medium' | 'large'
)
const radioSize = computed<'small' | 'medium' | 'large'>(
  () => (radioGroup?.size.value || resolvedSize.value) as 'small' | 'medium' | 'large'
)

const { inputId, classList } = useCheckable(() => ({
  prefix: 'radio',
  isChecked: isChecked.value,
  isDisabled: isDisabled.value,
  size: radioSize.value,
}))

function handleChange(): void {
  if (isDisabled.value) return
  if (radioGroup) {
    radioGroup.setValue(props.value)
  } else {
    emit('update:modelValue', props.value)
    emit('change', props.value)
  }
}
</script>

<template>
  <label :class="[classList, attrs.class]" :style="attrs.style" :for="inputId">
    <span class="nm-radio__input-wrapper">
      <input
        :id="inputId"
        type="radio"
        class="nm-radio__input"
        :checked="isChecked"
        :disabled="isDisabled"
        :name="radioGroup?.name.value || name"
        :value="value"
        v-bind="inputAttrs"
        @change="handleChange"
      />
      <span class="nm-radio__circle" aria-hidden="true">
        <span class="nm-radio__dot" />
      </span>
    </span>
    <span v-if="label || $slots.default" class="nm-radio__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
@use '@/styles/_checkable.scss' as *;

@include checkable-root('radio');
@include checkable-input-wrapper('radio');
@include checkable-hidden-input('radio');
@include checkable-indicator-base('radio', 'circle');
@include checkable-label('radio');
@include checkable-focus-ring('radio', 'circle');

// Radio-specific: circle + dot
.nm-radio__circle {
  border-radius: var(--nm-border-radius-full);
  position: relative;
  overflow: hidden;
}

// Ripple burst on select
.nm-radio__circle::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    circle at center,
    color-mix(in srgb, var(--nm-primary-color) 30%, transparent) 0%,
    transparent 70%
  );
  opacity: 0;
  transform: scale(0);
  transition: none;
}

.nm-radio--checked .nm-radio__circle::after {
  animation: nm-radio-ripple 0.45s $nm-ease-decelerate;
}

.nm-radio__dot {
  border-radius: var(--nm-border-radius-full);
  background-color: var(--nm-primary-color);
  transform: scale(0);
  @include nm-raised(1px, 2px);
  transition: transform 0.4s $nm-ease-bounce;
}

.nm-radio--checked .nm-radio__dot {
  transform: scale(1);
}

// Glow ring on checked
.nm-radio--checked .nm-radio__circle {
  box-shadow:
    inset 2px 2px 4px var(--nm-shadow-dark),
    inset -2px -2px 4px var(--nm-shadow-light),
    0 0 0 2px color-mix(in srgb, var(--nm-primary-color) 15%, transparent);
}

// Hover physics
.nm-radio:not(.nm-radio--disabled):hover .nm-radio__circle {
  box-shadow:
    inset 3px 3px 6px var(--nm-shadow-dark),
    inset -3px -3px 6px var(--nm-shadow-light);
}

.nm-radio:not(.nm-radio--disabled):hover .nm-radio__dot {
  filter: brightness(1.1);
}

// Active press feedback
.nm-radio:not(.nm-radio--disabled):active .nm-radio__circle {
  transform: scale(0.94);
  transition: transform 0.1s $nm-ease-compress;
}

@keyframes nm-radio-ripple {
  0% {
    opacity: 0.5;
    transform: scale(0);
  }
  100% {
    opacity: 0;
    transform: scale(2.5);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-radio__dot {
    transition: none;
    transform: scale(1);
  }
  .nm-radio--checked .nm-radio__circle::after {
    animation: none;
  }
  .nm-radio:not(.nm-radio--disabled):active .nm-radio__circle {
    transform: none;
  }
}

// Sizes (with dot dimensions)
.nm-radio--small {
  .nm-radio__circle {
    width: 18px;
    height: 18px;
  }
  .nm-radio__dot {
    width: var(--nm-spacing-sm);
    height: var(--nm-spacing-sm);
  }
}
.nm-radio--medium {
  .nm-radio__circle {
    width: var(--nm-spacing-lg);
    height: var(--nm-spacing-lg);
  }
  .nm-radio__dot {
    width: 12px;
    height: 12px;
  }
}
.nm-radio--large {
  .nm-radio__circle {
    width: 30px;
    height: 30px;
  }
  .nm-radio__dot {
    width: var(--nm-spacing-md);
    height: var(--nm-spacing-md);
  }
}
</style>
