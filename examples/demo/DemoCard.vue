<script setup lang="ts">
/**
 * 演示卡片外壳：统一的标题 + 徽标 + 正文槽位。
 *
 * 把原先散落在 ComponentsPage 里 46 份重复的 `<NeumorphismCard><template #header>…`
 * 收敛成一处，`pages/demos/*.vue` 只负责正文，标题与徽标由注册表元数据驱动。
 */
withDefaults(
  defineProps<{
    /** 锚点 id（侧栏跳转 + scroll-spy 依赖它） */
    id: string
    /** 卡片标题，如 `NeumorphismButton 按钮` */
    title: string
    /** 标题右侧一句话说明 */
    badge?: string
    /** 在 ≥1400px 的双列栅格里占满整行 */
    full?: boolean
  }>(),
  { badge: '', full: false }
)
</script>

<template>
  <NeumorphismCard :id="id" :elevation="1" :class="['demo-card', full ? 'demo-card--full' : '']">
    <template #header>
      <div class="demo-header">
        <h3 class="demo-title">{{ title }}</h3>
        <span v-if="badge" class="demo-badge">{{ badge }}</span>
      </div>
    </template>
    <slot />
  </NeumorphismCard>
</template>
