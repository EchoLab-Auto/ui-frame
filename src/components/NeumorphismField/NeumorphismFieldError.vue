<script setup lang="ts">
defineProps<{
  id?: string
  message?: string
}>()
</script>

<template>
  <div v-if="message" :id="id" class="nm-field__error" role="alert">
    {{ message }}
  </div>
</template>

<style scoped lang="scss">
.nm-field__error {
  font-size: var(--nm-font-sm);
  color: var(--nm-color-error);
  margin-top: var(--nm-spacing-xs);
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
