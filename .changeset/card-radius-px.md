---
'@echolab-auto/ui-frame': minor
---

**卡片圆角改为像素值（`radius: number`）**：删除 `'small' | 'medium' | 'large' | 'xl'` 四档文案与换算，`NeumorphismCard` 的 `radius` 直接收数字，就是 `border-radius` 的 px 值。

```vue
<!-- 旧 -->
<NeumorphismCard radius="large" />
<!-- 新 -->
<NeumorphismCard :radius="24" />
```

- 默认值仍是 24（即原来的 `large`，对应 `--nm-border-radius-lg`），所以**不传 `radius` 的卡片外观完全不变**
- 迁移对照：`small` → `8`、`medium` → `16`、`large` → `24`、`xl` → `32`（就是四个 `--nm-border-radius-*` token 的值）
- 全局配置同步改数字：`app.use(NeumorphismUI, { card: { radius: 16 } })`（原 `card: { radius: 'medium' }`）
- 之所以不再做档位：档位只能近似表达设计稿上的具体数值，而设计稿给的是数字；且四档映射到 token、token 是 px，中间多一层反而要记「中档到底是 16 还是 20」
- 组件把值写到根节点 `--nm-card-radius`，样式侧 `border-radius: var(--nm-card-radius, 24px)` 取用 —— 消费方既可用 prop / 全局配置，也能在样式表里整体覆盖；`squircle` / `clipPath` 读的仍是这个「生效圆角」，角形状与角大小互不干扰
- 健壮性：负值夹到 0（CSS 不接受负圆角，原先整条声明会被丢弃），`NaN` / 非有限数退回默认 24

> 破坏性：`radius` 的类型从字符串枚举变成 `number`。旧写法不会报错但会**落到默认 24px**（字符串转数字失败），请按上表改成数字；`radius="0"` 这类字符串同样失效，要写 `:radius="0"`。`NeumorphismAsciiArt` 的 `radius` 是另一套（含 `none`），本次未动。

顺带修掉两个和「圆角可变」相关的旧问题：

- **轮廓跟着半径走**：`radius` 变了会重新测量圆角（`watch` + `flush: 'post'`）。此前只有盒子尺寸变化才重测，改半径不触发 —— 档位时代难得踩到，换成滑块实时拖就是「拖了、轮廓不动」
- **`radius: 0` 能真的变直角**：`measure()` 读到计算圆角为 0 时不再沿用「上一次的非零值」，而是退回组件自己持有的 `radius`。旧缓存是为了防「开启轮廓后 `border-radius` 被强制置 0 → 下次测量把半径算成 0」，现在用 prop 值兜底更准：`0` 是「真的要直角」，不会被历史值劫持
