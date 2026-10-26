/**
 * 演示页共用原语。
 *
 * 六个演示文件里重复过的「卡片外壳 / 展示+配置台 / 参数行 / 变体矩阵」
 * 只在这里定义一次；`pages/demos/*.vue` 只描述各自的参数与状态。
 */
export { default as DemoCard } from './DemoCard.vue'
export { default as DemoPlayground } from './DemoPlayground.vue'
export { default as DemoField } from './DemoField.vue'
export { default as DemoPresets } from './DemoPresets.vue'
export type { DemoStage } from './DemoPlayground.vue'
export type { DemoPreset } from './DemoPresets.vue'
