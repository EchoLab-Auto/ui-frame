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
  font-size: 12px;
  color: var(--nm-color-error);
  margin-top: 4px;
}
</style>
