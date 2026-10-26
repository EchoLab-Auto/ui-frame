/**
 * 各组件 `size` 档位的锚点表 —— 数字 `size` 的插值依据。
 *
 * 每份 spec 声明两件事：
 * - `primary`：数字 `size` 的语义（主几何量）在三档上的 px 值
 * - `metrics`：从主几何量派生的其余几何量，各三锚点 px + 目标 CSS 变量名
 *
 * 锚点值必须与 `styles/tokens.scss` 里的组件 token 一致（组件样式消费的就是那些
 * token）；`src/utils/controlScale.test.ts` 会解析 tokens 逐个核对，改 token 忘了
 * 改这里会直接测试失败。
 *
 * 组件里 CSS 侧新增一条 `--sized` 规则把 `sz-*` 变量接到实际声明上；档位 class
 * 一行不改，因此 `size="small"` 与 `:size="32"` 在锚点处逐像素一致。
 */

import type { ControlScaleSpec } from './controlScale'

// ============================================================
//  控件族（高度即主几何量）
// ============================================================

/** 按钮：`size` 的数字语义 = 最小高度 px */
export const BUTTON_SCALE: ControlScaleSpec = {
  primary: { sm: 32, md: 44, lg: 56 },
  primaryVar: '--nm-button-sz-height',
  metrics: {
    '--nm-button-sz-font': { sm: 13, md: 14, lg: 16 },
    '--nm-button-sz-pad-y': { sm: 8, md: 12, lg: 16 },
    '--nm-button-sz-pad-x': { sm: 16, md: 24, lg: 32 },
  },
}

/**
 * 表单控件族（Input / Textarea / Select / AutoComplete / DatePicker / InputNumber）：
 * `size` 的数字语义 = 最小高度 px。整族共用 `--nm-field-*` token。
 */
export const FIELD_SCALE: ControlScaleSpec = {
  primary: { sm: 36, md: 48, lg: 60 },
  primaryVar: '--nm-field-sz-height',
  metrics: {
    '--nm-field-sz-font': { sm: 13, md: 14, lg: 16 },
    '--nm-field-sz-pad-y': { sm: 6, md: 10, lg: 14 },
    '--nm-field-sz-pad-x': { sm: 12, md: 16, lg: 20 },
    '--nm-field-sz-affix-x': { sm: 10, md: 14, lg: 16 },
  },
}

/** 分段控制器：`size` 的数字语义 = 单段最小高度 px */
export const SEGMENTED_SCALE: ControlScaleSpec = {
  primary: { sm: 26, md: 32, lg: 38 },
  primaryVar: '--nm-segmented-sz-height',
  metrics: {
    // medium 档不声明 font-size，继承根上的 --nm-font-md = 13
    '--nm-segmented-sz-font': { sm: 12, md: 13, lg: 15 },
    '--nm-segmented-sz-pad-y': { sm: 2, md: 4, lg: 8 },
    '--nm-segmented-sz-pad-x': { sm: 8, md: 16, lg: 24 },
  },
}

/** 主题切换器：`size` 的数字语义 = 内层按钮上下内距 px */
export const THEME_TOGGLE_SCALE: ControlScaleSpec = {
  primary: { sm: 5, md: 6, lg: 8 },
  primaryVar: '--nm-theme-toggle-sz-btn-pad-y',
  metrics: {
    '--nm-theme-toggle-sz-btn-pad-x': { sm: 8, md: 12, lg: 16 },
    '--nm-theme-toggle-sz-pad': { sm: 2, md: 3, lg: 4 },
    '--nm-theme-toggle-sz-icon': { sm: 14, md: 16, lg: 18 },
    '--nm-theme-toggle-sz-font': { sm: 12, md: 12, lg: 14 },
  },
}

/** 上传：`size` 的数字语义 = 触发区最小高度 px */
export const UPLOAD_SCALE: ControlScaleSpec = {
  primary: { sm: 72, md: 100, lg: 140 },
  primaryVar: '--nm-upload-sz-trigger-height',
  metrics: {},
}

// ============================================================
//  文本密度族（字号即主几何量）
// ============================================================

/** 标签：`size` 的数字语义 = 字号 px */
export const TAG_SCALE: ControlScaleSpec = {
  primary: { sm: 11, md: 12, lg: 14 },
  primaryVar: '--nm-tag-sz-font',
  metrics: {
    '--nm-tag-sz-pad-y': { sm: 2, md: 4, lg: 6 },
    '--nm-tag-sz-pad-x': { sm: 8, md: 12, lg: 16 },
    '--nm-tag-sz-height': { sm: 22, md: 28, lg: 34 },
  },
}

/** 提示条：`size` 的数字语义 = 正文字号 px */
export const ALERT_SCALE: ControlScaleSpec = {
  primary: { sm: 12, md: 13, lg: 14 },
  primaryVar: '--nm-alert-sz-font',
  metrics: {
    '--nm-alert-sz-title-font': { sm: 13, md: 14, lg: 16 },
    '--nm-alert-sz-pad-y': { sm: 8, md: 12, lg: 16 },
    '--nm-alert-sz-pad-x': { sm: 12, md: 16, lg: 20 },
  },
}

/** 面包屑：`size` 的数字语义 = 字号 px */
export const BREADCRUMB_SCALE: ControlScaleSpec = {
  primary: { sm: 12, md: 14, lg: 16 },
  primaryVar: '--nm-breadcrumb-sz-font',
  metrics: {},
}

/** 列表：`size` 的数字语义 = 字号 px */
export const LIST_SCALE: ControlScaleSpec = {
  primary: { sm: 12, md: 14, lg: 15 },
  primaryVar: '--nm-list-sz-font',
  metrics: {
    '--nm-list-sz-pad-y': { sm: 4, md: 8, lg: 16 },
    '--nm-list-sz-pad-x': { sm: 8, md: 16, lg: 24 },
  },
}

/** 标签页：`size` 的数字语义 = 标签字号 px */
export const TABS_SCALE: ControlScaleSpec = {
  primary: { sm: 12, md: 14, lg: 16 },
  primaryVar: '--nm-tabs-sz-font',
  metrics: {
    '--nm-tabs-sz-pad-y': { sm: 6, md: 10, lg: 14 },
    '--nm-tabs-sz-pad-x': { sm: 14, md: 20, lg: 28 },
  },
}

/** 折叠面板：`size` 的数字语义 = 标题字号 px */
export const COLLAPSE_SCALE: ControlScaleSpec = {
  primary: { sm: 13, md: 15, lg: 16 },
  primaryVar: '--nm-collapse-sz-font',
  metrics: {
    '--nm-collapse-sz-pad-y': { sm: 12, md: 16, lg: 20 },
    '--nm-collapse-sz-pad-x': { sm: 16, md: 20, lg: 28 },
  },
}

// ============================================================
//  数据密度族
// ============================================================

/** 表格：`size` 的数字语义 = 单元格上下内距 px（行密度） */
export const TABLE_SCALE: ControlScaleSpec = {
  primary: { sm: 8, md: 12, lg: 16 },
  primaryVar: '--nm-table-sz-pad-y',
  metrics: {
    '--nm-table-sz-pad-x': { sm: 12, md: 16, lg: 20 },
    '--nm-table-sz-font': { sm: 12, md: 14, lg: 15 },
  },
}

/** 分页：`size` 的数字语义 = 页码按钮高 px */
export const PAGINATION_SCALE: ControlScaleSpec = {
  primary: { sm: 30, md: 38, lg: 46 },
  primaryVar: '--nm-pagination-sz-height',
  metrics: {
    '--nm-pagination-sz-min-width': { sm: 30, md: 38, lg: 46 },
    '--nm-pagination-sz-font': { sm: 12, md: 14, lg: 16 },
  },
}

/** 步骤条：`size` 的数字语义 = 序号圆直径 px */
export const STEPS_SCALE: ControlScaleSpec = {
  primary: { sm: 28, md: 36, lg: 48 },
  primaryVar: '--nm-steps-sz-circle',
  metrics: {
    '--nm-steps-sz-font': { sm: 12, md: 14, lg: 15 },
  },
}

/** 进度条：`size` 的数字语义 = 线形条厚度 px（环形直径/描边同步插值） */
export const PROGRESS_SCALE: ControlScaleSpec = {
  primary: { sm: 4, md: 8, lg: 12 },
  primaryVar: '--nm-progress-sz-height',
  metrics: {
    '--nm-progress-sz-circle': { sm: 64, md: 120, lg: 160 },
    '--nm-progress-sz-stroke': { sm: 4, md: 7, lg: 10 },
  },
}

// ============================================================
//  导航族
// ============================================================

/** 下拉菜单：`size` 的数字语义 = 菜单项字号 px */
export const MENU_SCALE: ControlScaleSpec = {
  primary: { sm: 11, md: 14, lg: 15 },
  primaryVar: '--nm-menu-sz-font',
  metrics: {
    '--nm-menu-sz-pad-x': { sm: 8, md: 16, lg: 24 },
    '--nm-menu-sz-pad-y': { sm: 5, md: 7, lg: 9 },
    '--nm-menu-sz-gap': { sm: 2, md: 4, lg: 8 },
    '--nm-menu-sz-icon': { sm: 14, md: 18, lg: 20 },
  },
}

/** 导航菜单：`size` 的数字语义 = 导航项字号 px */
export const NAV_MENU_SCALE: ControlScaleSpec = {
  primary: { sm: 11, md: 14, lg: 15 },
  primaryVar: '--nm-nav-sz-font',
  metrics: {
    '--nm-nav-sz-pad-x': { sm: 8, md: 16, lg: 24 },
    '--nm-nav-sz-pad-y': { sm: 6, md: 8, lg: 10 },
    '--nm-nav-sz-gap': { sm: 2, md: 4, lg: 8 },
    '--nm-nav-sz-icon': { sm: 14, md: 18, lg: 20 },
    '--nm-nav-sz-indicator': { sm: 2, md: 2, lg: 3 },
  },
}

// ============================================================
//  独立几何族
// ============================================================

/** 头像：`size` 的数字语义 = 直径 px */
export const AVATAR_SCALE: ControlScaleSpec = {
  primary: { sm: 32, md: 44, lg: 64 },
  primaryVar: '--nm-avatar-sz-size',
  metrics: {
    '--nm-avatar-sz-font': { sm: 12, md: 16, lg: 22 },
  },
}

/** 空状态：`size` 的数字语义 = 插图边长 px */
export const EMPTY_SCALE: ControlScaleSpec = {
  primary: { sm: 60, md: 100, lg: 140 },
  primaryVar: '--nm-empty-sz-illustration',
  metrics: {
    '--nm-empty-sz-font': { sm: 12, md: 14, lg: 15 },
  },
}

/**
 * 复选框：`size` 的数字语义 = **勾选框边长** px。
 *
 * 锚点取 `checkable-sizes` 混基给 `.nm-checkbox__box` 的 18 / 24 / 30；
 * 里面的勾形图标是另一套枚举档（`--nm-icon-size-xs/sm/md` = 12 / 14 / 16），
 * 单列成 `--nm-checkbox-sz-icon`，不能拿它当主几何量。
 */
export const CHECKBOX_SCALE: ControlScaleSpec = {
  primary: { sm: 18, md: 24, lg: 30 },
  primaryVar: '--nm-checkbox-sz-box',
  metrics: {
    '--nm-checkbox-sz-icon': { sm: 12, md: 14, lg: 16 },
  },
}

/**
 * 单选框：`size` 的数字语义 = 圆圈直径 px。
 *
 * 锚点取 `checkable-sizes` 混基给 `.nm-radio__circle` 的 18 / 24 / 30；
 * 内部圆点在三档上走 spacing token（8 / 12 / 16），不是圆圈的等比缩放，
 * 所以单列成 `--nm-radio-sz-dot`，数字路径才不会在锚点处差 1px。
 */
export const RADIO_SCALE: ControlScaleSpec = {
  primary: { sm: 18, md: 24, lg: 30 },
  primaryVar: '--nm-radio-sz-box',
  metrics: {
    '--nm-radio-sz-dot': { sm: 8, md: 12, lg: 16 },
  },
}

/** 滑块：`size` 的数字语义 = 轨道粗细 px */
export const SLIDER_SCALE: ControlScaleSpec = {
  primary: { sm: 6, md: 8, lg: 10 },
  primaryVar: '--nm-slider-sz-rail',
  metrics: {},
}

/** 全部尺度（测试按组件名核对锚点与 token 是否一致） */
export const CONTROL_SCALES = {
  button: BUTTON_SCALE,
  field: FIELD_SCALE,
  segmented: SEGMENTED_SCALE,
  themeToggle: THEME_TOGGLE_SCALE,
  upload: UPLOAD_SCALE,
  tag: TAG_SCALE,
  alert: ALERT_SCALE,
  breadcrumb: BREADCRUMB_SCALE,
  list: LIST_SCALE,
  tabs: TABS_SCALE,
  collapse: COLLAPSE_SCALE,
  table: TABLE_SCALE,
  pagination: PAGINATION_SCALE,
  steps: STEPS_SCALE,
  progress: PROGRESS_SCALE,
  menu: MENU_SCALE,
  navMenu: NAV_MENU_SCALE,
  avatar: AVATAR_SCALE,
  empty: EMPTY_SCALE,
  checkbox: CHECKBOX_SCALE,
  radio: RADIO_SCALE,
  slider: SLIDER_SCALE,
} as const
