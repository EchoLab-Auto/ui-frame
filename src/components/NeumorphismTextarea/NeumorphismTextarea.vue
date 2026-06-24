<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick, useAttrs } from 'vue'
import { useFormField } from '@/composables/useFormField'
import { useNeumorphismSetup } from '@/extensions/createComponent'
import NeumorphismFieldLabel from '@/components/NeumorphismField/NeumorphismFieldLabel.vue'
import NeumorphismFieldError from '@/components/NeumorphismField/NeumorphismFieldError.vue'

defineOptions({ inheritAttrs: false })

export interface NeumorphismTextareaProps {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  size?: 'small' | 'medium' | 'large'
  maxlength?: number | string
  minlength?: number | string
  label?: string
  error?: string | boolean
  name?: string
  id?: string
  inputmode?: 'none' | 'text' | 'search'
  rows?: number | string
  autoResize?: boolean
  showCount?: boolean
}

const props = withDefaults(defineProps<NeumorphismTextareaProps>(), {
  modelValue: '',
  disabled: false,
  readonly: false,
  required: false,
  size: 'medium',
  rows: 4,
  autoResize: false,
  showCount: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'input', event: Event): void
  (e: 'change', event: Event): void
  (e: 'keydown', event: KeyboardEvent): void
  (e: 'enter', value: string): void
}>()

const attrs = useAttrs()

const textareaAttrs = computed(() => {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(attrs)) {
    if (key !== 'class' && key !== 'style') {
      result[key] = attrs[key]
    }
  }
  return result
})

const { config, resolveProp } = useNeumorphismSetup()

const resolvedSize = computed(() => resolveProp(props.size, config.value.textarea?.size, 'medium'))

const { fieldId, errorMessage, baseClassList, handleFocus, handleBlur } = useFormField(() => ({
  id: props.id,
  size: resolvedSize.value,
  disabled: props.disabled,
  error: props.error,
  prefix: 'textarea',
}))

const textareaRef = ref<HTMLTextAreaElement>()
const charCount = computed(() => props.modelValue?.length || 0)

const classList = computed(() => [
  ...baseClassList('nm-textarea').value,
  {
    'nm-textarea--readonly': props.readonly,
    'nm-textarea--has-label': !!props.label,
  },
])

function adjustHeight() {
  if (!props.autoResize || !textareaRef.value) return
  textareaRef.value.style.height = 'auto'
  textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
}

function handleInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
  emit('input', event)
  adjustHeight()
}

function handleChange(event: Event): void {
  emit('change', event)
}

function handleKeydown(event: KeyboardEvent): void {
  emit('keydown', event)
  if (event.key === 'Enter' && !event.shiftKey) {
    emit('enter', props.modelValue)
  }
}

onMounted(() => {
  adjustHeight()
})

watch(
  () => props.modelValue,
  () => {
    if (props.autoResize) {
      nextTick(adjustHeight)
    }
  }
)
</script>

<template>
  <div class="nm-textarea__wrapper" :class="attrs.class" :style="attrs.style">
    <NeumorphismFieldLabel :label="label" :required="required" :for-id="fieldId" />
    <div :class="classList">
      <textarea
        :id="fieldId"
        ref="textareaRef"
        class="nm-textarea__field"
        :class="{ 'nm-textarea__field--auto-resize': autoResize }"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :maxlength="maxlength"
        :minlength="minlength"
        :rows="rows"
        :name="name"
        :inputmode="inputmode"
        :aria-invalid="!!error"
        :aria-errormessage="errorMessage ? `${fieldId}-error` : undefined"
        v-bind="textareaAttrs"
        @input="handleInput"
        @change="handleChange"
        @focus="(e: FocusEvent) => handleFocus(e, emit)"
        @blur="(e: FocusEvent) => handleBlur(e, emit)"
        @keydown="handleKeydown"
      />
    </div>
    <div class="nm-textarea__footer">
      <NeumorphismFieldError :id="`${fieldId}-error`" :message="errorMessage" />
      <span v-if="showCount && maxlength" class="nm-textarea__count">
        {{ charCount }} / {{ maxlength }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.nm-textarea__wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-sm);
  width: 100%;
}

.nm-textarea {
  display: flex;
  width: 100%;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-inset(4px, 8px);
  @include nm-theme-transition;
  transition:
    box-shadow 0.35s $nm-ease-spring,
    transform 0.3s $nm-ease-spring;

  &:not(.nm-textarea--disabled):not(.nm-textarea--focused):hover {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark),
      inset -5px -5px 10px var(--nm-shadow-light);
    transform: translateY(-1px);
  }

  &--focused {
    box-shadow:
      inset 5px 5px 10px var(--nm-shadow-dark),
      inset -5px -5px 10px var(--nm-shadow-light),
      0 0 0 3px var(--nm-primary-color);
    transform: translateY(-1px);
  }

  &--error {
    box-shadow:
      inset 4px 4px 8px var(--nm-shadow-dark),
      inset -4px -4px 8px var(--nm-shadow-light),
      0 0 0 2px var(--nm-color-error);
    &.nm-textarea--focused {
      box-shadow:
        inset 5px 5px 10px var(--nm-shadow-dark),
        inset -5px -5px 10px var(--nm-shadow-light),
        0 0 0 3px var(--nm-color-error);
    }
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  // Error shake
  &--error-shake {
    animation: nm-textarea-shake 0.4s $nm-ease-compress;
  }
}

@keyframes nm-textarea-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-5px);
  }
  40% {
    transform: translateX(5px);
  }
  60% {
    transform: translateX(-3px);
  }
  80% {
    transform: translateX(3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nm-textarea {
    transition: none;
  }
  .nm-textarea--error-shake {
    animation: none;
  }
}

.nm-textarea__field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--nm-text-primary);
  font-family: inherit;
  font-size: var(--nm-font-base);
  line-height: 1.6;
  resize: vertical;
  width: 100%;

  &::placeholder {
    color: var(--nm-text-placeholder);
  }
  &:disabled {
    cursor: not-allowed;
  }

  &--auto-resize {
    resize: none;
    overflow: hidden;
  }
}

.nm-textarea__footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.nm-textarea__count {
  font-size: var(--nm-font-sm);
  color: var(--nm-text-placeholder);
  margin-left: auto;
}

// Sizes
.nm-textarea--small .nm-textarea__field {
  padding: var(--nm-field-padding-y-sm) var(--nm-field-padding-x-sm);
  font-size: var(--nm-field-font-sm);
}
.nm-textarea--medium .nm-textarea__field {
  padding: var(--nm-field-padding-y-md) var(--nm-field-padding-x-md);
  font-size: var(--nm-field-font-md);
}
.nm-textarea--large .nm-textarea__field {
  padding: var(--nm-field-padding-y-lg) var(--nm-field-padding-x-lg);
  font-size: var(--nm-field-font-lg);
}
</style>
