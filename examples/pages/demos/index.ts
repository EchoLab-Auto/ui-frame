import type { Component } from 'vue'

import ButtonDemo from './ButtonDemo.vue'
import SwitchDemo from './SwitchDemo.vue'
import CheckboxDemo from './CheckboxDemo.vue'
import RadioDemo from './RadioDemo.vue'
import InputDemo from './InputDemo.vue'
import TextareaDemo from './TextareaDemo.vue'
import SelectDemo from './SelectDemo.vue'
import InputExtraDemo from './InputExtraDemo.vue'
import FormDemo from './FormDemo.vue'
import FieldDemo from './FieldDemo.vue'
import CardDemo from './CardDemo.vue'
import AvatarDemo from './AvatarDemo.vue'
import BadgeDemo from './BadgeDemo.vue'
import TagDemo from './TagDemo.vue'
import ProgressDemo from './ProgressDemo.vue'
import SkeletonDemo from './SkeletonDemo.vue'
import DividerDemo from './DividerDemo.vue'
import ScrollbarDemo from './ScrollbarDemo.vue'
import DisplayExtraDemo from './DisplayExtraDemo.vue'
import ChartDemo from './ChartDemo.vue'
import TabsDemo from './TabsDemo.vue'
import BreadcrumbDemo from './BreadcrumbDemo.vue'
import PaginationDemo from './PaginationDemo.vue'
import NavExtraDemo from './NavExtraDemo.vue'
import ModalDemo from './ModalDemo.vue'
import ModalLayerTestDemo from './ModalLayerTestDemo.vue'
import ToastDemo from './ToastDemo.vue'
import TooltipDemo from './TooltipDemo.vue'
import CollapseDemo from './CollapseDemo.vue'
import FeedbackExtraDemo from './FeedbackExtraDemo.vue'
import StatusFeedbackDemo from './StatusFeedbackDemo.vue'
import ChatFoldDemo from './ChatFoldDemo.vue'
import ChatComposerDemo from './ChatComposerDemo.vue'
import DocCodeBlockDemo from './DocCodeBlockDemo.vue'
import DocTocNavDemo from './DocTocNavDemo.vue'
import ContainerDemo from './ContainerDemo.vue'
import GridDemo from './GridDemo.vue'
import LayoutDemo from './LayoutDemo.vue'
import ThemeToggleDemo from './ThemeToggleDemo.vue'
import TreeDemo from './TreeDemo.vue'
import CanvasDemo from './CanvasDemo.vue'
import LogoDemo from './LogoDemo.vue'
import ArtDemo from './ArtDemo.vue'
import AsciiArtDemo from './AsciiArtDemo.vue'
import PixelFontDemo from './PixelFontDemo.vue'
import GraphDemo from './GraphDemo.vue'

/**
 * 演示条目元数据。
 *
 * 卡片外壳、侧栏导航、scroll-spy 目标全部由这张表驱动——
 * 加一个演示 = 写一个 `pages/demos/XxxDemo.vue` + 在这里登记一行，
 * 不用再去三个地方（nav 数组 / 卡片标题 / 锚点 id）同步。
 */
export interface DemoEntry {
  /** 锚点 id（同时是侧栏跳转与 scroll-spy 的目标） */
  id: string
  /** 侧栏里的短标签 */
  nav: string
  /** 卡片标题 */
  title: string
  /** 标题右侧的一句话说明 */
  badge: string
  /** 在 ≥1400px 的双列栅格里占满整行 */
  full?: boolean
  component: Component
}

export interface DemoCategory {
  title: string
  desc: string
  items: DemoEntry[]
}

export const demoCategories: DemoCategory[] = [
  {
    title: '基础输入',
    desc: '新拟态风格的输入类组件，包含按钮、开关、复选框、单选框、输入框、文本域和选择器。',
    items: [
      {
        id: 'buttons',
        nav: '按钮 Button',
        title: 'NeumorphismButton 按钮',
        badge: '展示 + 配置 · 七个变体（含玻璃三档）/ 尺寸 / 形状 / 状态',
        full: true,
        component: ButtonDemo,
      },
      {
        id: 'switch',
        nav: '开关 Switch',
        title: 'NeumorphismSwitch 开关',
        badge: '尺寸可调 · 文本标签 · power 变体',
        component: SwitchDemo,
      },
      {
        id: 'checkbox',
        nav: '复选框 Checkbox',
        title: 'NeumorphismCheckbox 复选框',
        badge: '半选 · 尺寸可调',
        component: CheckboxDemo,
      },
      {
        id: 'radio',
        nav: '单选框 Radio',
        title: 'NeumorphismRadio 单选框',
        badge: 'RadioGroup · 水平/垂直',
        component: RadioDemo,
      },
      {
        id: 'input',
        nav: '输入框 Input',
        title: 'NeumorphismInput 输入框',
        badge: '标签 · 前缀/后缀 · 验证状态',
        component: InputDemo,
      },
      {
        id: 'textarea',
        nav: '文本域 Textarea',
        title: 'NeumorphismTextarea 文本域',
        badge: '字数统计 · 自动调整高度',
        component: TextareaDemo,
      },
      {
        id: 'select',
        nav: '选择器 Select',
        title: 'NeumorphismSelect 选择器',
        badge: '键盘导航 · 可清空 · 可搜索 · 多选 · 分组 · 双变体 · ARIA',
        full: true,
        component: SelectDemo,
      },
      {
        id: 'input-extra',
        nav: '数字 / 滑块 / 日期 · 联想',
        title: 'InputNumber · Slider · DatePicker · AutoComplete',
        badge: '步进 · 拖动 · 日历 · 联想',
        full: true,
        component: InputExtraDemo,
      },
    ],
  },
  {
    title: '表单',
    desc: '表单容器与表单项，内置验证规则引擎，支持必填、正则、长度限制和自定义校验器。',
    items: [
      {
        id: 'form',
        nav: '表单 Form',
        title: 'NeumorphismForm 表单与 FormItem',
        badge: '验证 · 提交 · 错误清除',
        full: true,
        component: FormDemo,
      },
      {
        id: 'field',
        nav: '字段辅助 Field',
        title: 'NeumorphismField 字段辅助',
        badge: 'Label · Error · 关联',
        component: FieldDemo,
      },
    ],
  },
  {
    title: '数据展示',
    desc: '用于展示数据和内容的组件，包括卡片、头像、徽标、标签、进度条、骨架屏和分割线。',
    items: [
      {
        id: 'card',
        nav: '卡片 Card',
        title: 'NeumorphismCard 卡片',
        badge: '统一台阶高度模型 · 膨胀/下沉悬停 · 玻璃拟态',
        full: true,
        component: CardDemo,
      },
      {
        id: 'avatar',
        nav: '头像 Avatar',
        title: 'NeumorphismAvatar 头像',
        badge: '图片 · 首字母回退 · 尺寸可调',
        component: AvatarDemo,
      },
      {
        id: 'badge',
        nav: '徽标 Badge',
        title: 'NeumorphismBadge 徽标',
        badge: '数字角标 · 圆点模式',
        component: BadgeDemo,
      },
      {
        id: 'tag',
        nav: '标签 Tag',
        title: 'NeumorphismTag 标签',
        badge: '6 色 · 可关闭 · 圆角',
        component: TagDemo,
      },
      {
        id: 'progress',
        nav: '进度条 Progress',
        title: 'NeumorphismProgress 进度条',
        badge: '环形 · 动效 · 不确定 · 动画数字',
        component: ProgressDemo,
      },
      {
        id: 'skeleton',
        nav: '骨架屏 Skeleton',
        title: 'NeumorphismSkeleton 骨架屏',
        badge: '呼吸 · 波浪动画',
        component: SkeletonDemo,
      },
      {
        id: 'divider',
        nav: '分割线 Divider',
        title: 'NeumorphismDivider 分割线',
        badge: '水平/垂直 · 文字 · 虚线',
        component: DividerDemo,
      },
      {
        id: 'scrollbar',
        nav: '滚动条 Scrollbar',
        title: '定制滚动条',
        badge: '5 种预设变体 · CSS 变量可调',
        component: ScrollbarDemo,
      },
      {
        id: 'chart',
        nav: '图表 Chart',
        title: 'NeumorphismChart 图表',
        badge: '柱状图 · 折线图 · 饼图 · K 线图',
        full: true,
        component: ChartDemo,
      },
      {
        id: 'display-extra',
        nav: '表格 / 列表 · 空态',
        title: 'Table · List · Empty · VirtualList',
        badge: '排序 · 空态 · 千行虚拟滚动',
        full: true,
        component: DisplayExtraDemo,
      },
    ],
  },
  {
    title: '导航',
    desc: '页面导航类组件，包括选项卡、面包屑和分页器，均支持键盘操作和无障碍访问。',
    items: [
      {
        id: 'tabs',
        nav: '选项卡 Tabs',
        title: 'NeumorphismTabs 选项卡',
        badge: '顶部/左侧 · 键盘导航',
        component: TabsDemo,
      },
      {
        id: 'breadcrumb',
        nav: '面包屑 Breadcrumb',
        title: 'NeumorphismBreadcrumb 面包屑',
        badge: '链接/文本 · 自定义分隔符 · ARIA',
        component: BreadcrumbDemo,
      },
      {
        id: 'pagination',
        nav: '分页 Pagination',
        title: 'NeumorphismPagination 分页',
        badge: '省略号 · 总数 · 跳转 · 尺寸可调',
        component: PaginationDemo,
      },
      {
        id: 'nav-extra',
        nav: '菜单 / 下拉 · 步骤',
        title: 'Menu · NavMenu · Dropdown · Steps',
        badge: '纵向菜单 · 指示条 · 下拉 · 步骤条',
        full: true,
        component: NavExtraDemo,
      },
    ],
  },
  {
    title: '反馈',
    desc: '用户反馈类组件，包括模态框、消息提示、文字提示和折叠面板。',
    items: [
      {
        id: 'modal',
        nav: '模态框 Modal',
        title: 'NeumorphismModal 模态框',
        badge: '背景模糊 · 焦点锁定 · Esc 关闭',
        component: ModalDemo,
      },
      {
        id: 'toast',
        nav: '消息提示 Toast',
        title: 'NeumorphismToast 消息提示',
        badge: '4 类型 · 6 位置 · 自动关闭',
        component: ToastDemo,
      },
      {
        id: 'tooltip',
        nav: '文字提示 Tooltip',
        title: 'NeumorphismTooltip 文字提示',
        badge: '4 方向 · 悬停/点击/聚焦',
        component: TooltipDemo,
      },
      {
        id: 'collapse',
        nav: '折叠面板 Collapse',
        title: 'NeumorphismCollapse 折叠面板',
        badge: '手风琴 · 弹簧动画',
        component: CollapseDemo,
      },
      {
        id: 'status-feedback',
        nav: '状态点 · 加载 · 分段',
        title: 'StatusDot · Spinner · Segmented',
        badge: '状态点呼吸脉冲 · 加载指示 · 分段单选',
        full: true,
        component: StatusFeedbackDemo,
      },
      {
        id: 'feedback-extra',
        nav: '提示条 / 抽屉 · 上传',
        title: 'Alert · Drawer · Upload',
        badge: '四种类型 · 抽屉 · 拖拽上传',
        full: true,
        component: FeedbackExtraDemo,
      },
      {
        id: 'modal-layer-test',
        nav: '层叠联动验证',
        title: '层叠联动验证 — Modal + Form + Select',
        badge: 'z-index 复查 · Teleport 层级 · scroll 偏移',
        full: true,
        component: ModalLayerTestDemo,
      },
    ],
  },
  {
    title: '聊天原子组件',
    desc: '@echolab-auto/ui-frame/chat 子路径模块的原子组件（输入器 / 折叠块 / 复制按钮）：零领域类型、插槽驱动，可自由组装任意聊天式 UI。整体组装效果见顶部导航「聊天组件」页。',
    items: [
      {
        id: 'chat-fold',
        nav: '折叠块 ChatFold',
        title: 'ChatFold 折叠块',
        badge: '凹陷 / 凸起 · 四插槽 · 受控可选',
        full: true,
        component: ChatFoldDemo,
      },
      {
        id: 'chat-composer',
        nav: '输入器 ChatComposer',
        title: 'ChatComposer 输入器',
        badge: 'Enter 发送 · IME 安全 · 玻璃托盘 · 4 种聚焦特效',
        full: true,
        component: ChatComposerDemo,
      },
    ],
  },
  {
    title: '文档元组件',
    desc: '@echolab-auto/ui-frame/doc 子路径模块拆出的纯 UI 原语：代码块、目录导航可脱离 MarkdownRenderer 单独使用。整体组合效果见顶部导航「文档组件」页。',
    items: [
      {
        id: 'doc-code-block',
        nav: '代码块 DocCodeBlock',
        title: 'DocCodeBlock 代码块',
        badge: '语法高亮 · 行号 · 一键复制',
        full: true,
        component: DocCodeBlockDemo,
      },
      {
        id: 'doc-toc-nav',
        nav: '目录导航 DocTocNav',
        title: 'DocTocNav 目录导航',
        badge: '层级折叠 · 激活高亮 · 自动展开祖先',
        full: true,
        component: DocTocNavDemo,
      },
    ],
  },
  {
    title: '布局',
    desc: '页面布局类组件，包括响应式容器、24 栅格系统和经典页面框架（Header + Sider + Content + Footer）。',
    items: [
      {
        id: 'container',
        nav: '容器 Container',
        title: 'NeumorphismContainer 容器',
        badge: 'Fixed/Fluid · 响应式断点',
        component: ContainerDemo,
      },
      {
        id: 'grid',
        nav: '栅格 Grid',
        title: 'NeumorphismRow / NeumorphismCol 栅格',
        badge: '24 栅格 · 6 断点 · Gutter · 偏移',
        full: true,
        component: GridDemo,
      },
      {
        id: 'layout',
        nav: '布局 Layout',
        title: 'NeumorphismLayout 页面布局',
        badge: 'Header+Sider+Content+Footer · 移动端抽屉',
        full: true,
        component: LayoutDemo,
      },
    ],
  },
  {
    title: '扩展',
    desc: '补充组件，包括三态主题切换、树形导航和基础画布容器，用于满足文档和流程图等复杂交互场景。',
    items: [
      {
        id: 'themetoggle',
        nav: '主题切换 ThemeToggle',
        title: 'NeumorphismThemeToggle 主题切换',
        badge: '三态 · light / dark / auto',
        component: ThemeToggleDemo,
      },
      {
        id: 'tree',
        nav: '树形导航 Tree',
        title: 'NeumorphismTree 树形导航',
        badge: '展开/折叠 · 搜索高亮 · 选中高亮',
        full: true,
        component: TreeDemo,
      },
      {
        id: 'canvas',
        nav: '画布 Canvas',
        title: 'NeumorphismCanvas 画布',
        badge: '拖拽平移 · 滚轮缩放 · 适应屏幕 · 全屏',
        full: true,
        component: CanvasDemo,
      },
      {
        id: 'logo',
        nav: 'Logo 动效 Logo',
        title: 'NeumorphismLogo 像素 Logo 动效',
        badge: '4 种模式 · 黏液滤镜 · 指针交互',
        full: true,
        component: LogoDemo,
      },
      {
        id: 'art',
        nav: '试验效果 Art',
        title: 'NeumorphismArt 试验效果',
        badge: '5 效果 · 指针交互 · 速度/密度可调',
        full: true,
        component: ArtDemo,
      },
      {
        id: 'ascii-art',
        nav: '字符画 AsciiArt',
        title: 'NeumorphismAsciiArt 字符画',
        badge: '图片 → ASCII · 调参面板 · 实时预览',
        full: true,
        component: AsciiArtDemo,
      },
      {
        id: 'pixel-font',
        nav: '像素字体 PixelFont',
        title: 'NeumorphismPixelFont 像素字体',
        badge: 'termsyn 6x11 · 位图字体 · 整数倍缩放',
        full: true,
        component: PixelFontDemo,
      },
      {
        id: 'graph',
        nav: '节点图 GraphView',
        title: 'NeumorphismGraphView 节点图',
        badge: '实验性 · 力导向布局 · 自绘 canvas',
        full: true,
        component: GraphDemo,
      },
    ],
  },
]

/** 按序平铺的全部锚点 id（scroll-spy 用） */
export const allDemoIds = demoCategories.flatMap(c => c.items.map(i => i.id))
