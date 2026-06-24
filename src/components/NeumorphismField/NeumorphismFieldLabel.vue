<script setup lang="ts">
defineProps<{
  label?: string
  required?: boolean
  forId?: string
}>()
</script>

<template>
  <label v-if="label" :for="forId" class="nm-field__label">
    {{ label }}
    <span v-if="required" class="nm-field__required">*</span>
  </label>
</template>

<style scoped lang="scss">
.nm-field__label {
  font-size: var(--nm-font-base);
  font-weight: 500;
  color: var(--nm-text-primary);
}

.nm-field__required {
  color: var(--nm-color-error);
  margin-left: 2px;
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
