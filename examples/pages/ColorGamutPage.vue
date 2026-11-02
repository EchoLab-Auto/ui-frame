<script setup lang="ts">
//! 色彩能力 / Display P3 验证页（2026-10-29）
//!
//! 回答一个具体问题：**ui-frame 要不要、以及能不能用 Display P3？**
//! 这一页把判断所需的全部事实摆在屏幕上，靠眼睛和 `matchMedia` 同时下结论。
//!
//! 四个结论区（按重要性排列）：
//!   1. 能力探测——本机/本屏到底支持什么（逐项打勾，不用猜）。
//!   2. **同数字陷阱**——把 sRGB 的数值原样搬进 P3，颜色会变艳。这是最常见的错。
//!   3. **正确转换 = 零变化**——把同一个颜色换算成 P3 坐标，肉眼完全一致。
//!      → 所以「支持 P3」如果只是换算，等于什么都没做。
//!   4. **P3 扩展色 = 唯一真实的增益**——主动挑选 sRGB 立方体之外的坐标，
//!      这才是广色域能看见的地方（下方荧光绿对比）。
//!
//! 另附 `@supports` 守卫的必要性演示（自定义属性的 IACVT 陷阱）。

import { computed, onMounted, ref } from 'vue'

/** 逐项能力探测的结果；SSR / 老浏览器下全部保持 false。 */
interface Capability {
  key: string
  label: string
  supported: boolean
  /** 这一项对我们的意义（显示在结果右侧） */
  note: string
}

const capabilities = ref<Capability[]>([])
const p3Available = ref(false)
const env = ref({ colorDepth: 0, pixelDepth: 0, dpr: 1, gamutLabel: '探测中…' })

onMounted(() => {
  const mq = (q: string) => {
    try {
      return window.matchMedia(q).matches
    } catch {
      return false
    }
  }
  const sup = (prop: string, value: string) => {
    try {
      return CSS.supports(prop, value)
    } catch {
      return false
    }
  }

  capabilities.value = [
    {
      key: 'p3',
      label: '(color-gamut: p3)',
      supported: mq('(color-gamut: p3)'),
      note: '屏幕色域达到 P3 —— 广色域唯一的前置条件',
    },
    {
      key: 'rec2020',
      label: '(color-gamut: rec2020)',
      supported: mq('(color-gamut: rec2020)'),
      note: '屏幕色域达到 Rec.2020（比 P3 更宽，消费级极少）',
    },
    {
      key: 'hdr',
      label: '(dynamic-range: high)',
      supported: mq('(dynamic-range: high)'),
      note: 'HDR **亮度**范围 —— 注意与色域是两个独立维度',
    },
    {
      key: 'hdr-video',
      label: '(video-dynamic-range: high)',
      supported: mq('(video-dynamic-range: high)'),
      note: '视频层 HDR（只影响 <video>，不影响 DOM）',
    },
    {
      key: 'p3-color',
      label: 'color(display-p3 …)',
      supported: sup('color', 'color(display-p3 1 0 0)'),
      note: 'CSS 能否写 P3 颜色（P3 的语法能力）',
    },
    {
      key: 'rec2100-pq',
      label: 'color(rec2100-pq …)',
      supported: sup('color', 'color(rec2100-pq 0.5 0.5 0.5)'),
      note: 'CSS 能否写 HDR **颜色**（PQ 曲线）—— 目前无浏览器实现',
    },
    {
      key: 'rec2100-hlg',
      label: 'color(rec2100-hlg …)',
      supported: sup('color', 'color(rec2100-hlg 0.5 0.5 0.5)'),
      note: 'CSS 能否写 HLG 曲线颜色 —— 目前无浏览器实现',
    },
    {
      key: 'oklch',
      label: 'oklch(…)',
      supported: sup('color', 'oklch(0.7 0.2 120)'),
      note: '感知均匀色彩空间（P3 的坐标可以无障碍写进来）',
    },
  ]

  p3Available.value = mq('(color-gamut: p3)')
  env.value = {
    colorDepth: window.screen?.colorDepth ?? 0,
    pixelDepth: window.screen?.pixelDepth ?? 0,
    dpr: window.devicePixelRatio || 1,
    gamutLabel: p3Available.value ? 'P3 或更宽' : 'sRGB（或未报告）',
  }
})

/** 结论：能写 P3 ≠ 屏幕支持 P3 ≠ 有视觉收益。三者必须同时成立。 */
const verdict = computed(() => {
  const canWrite = capabilities.value.find(c => c.key === 'p3-color')?.supported ?? false
  if (!canWrite) return { level: 'bad', text: '浏览器不支持 P3 色彩语法，本页对比无效。' }
  if (!p3Available.value)
    return {
      level: 'warn',
      text: '浏览器能写 P3，但当前屏幕未报告 P3 色域 —— 下方色块会被压缩回 sRGB，看不出差别。',
    }
  return {
    level: 'ok',
    text: '浏览器 + 屏幕都支持 P3：下方色块是真实广色域输出，可以看见差异。',
  }
})

// ── 色块对照数据 ────────────────────────────────────────────────────────────
// A 组：同一个颜色，两种写法。用来分辨「陷阱」与「正确转换」。
// sRGB #cdfa4e → P3 坐标 (0.8389, 0.9752, 0.4222)，由 Bradford 适应 D65 矩阵换算。
const sameColor = [
  { name: 'sRGB 原值', css: '#cdfa4e', desc: '我们现在用的写法' },
  {
    name: 'P3 照抄数字',
    css: 'color(display-p3 0.8039 0.9804 0.3059)',
    desc: '❌ 陷阱：同一串数字，颜色更艳更绿',
  },
  {
    name: 'P3 正确换算',
    css: 'color(display-p3 0.8389 0.9752 0.4222)',
    desc: '✅ 同一个颜色，肉眼看不出区别',
  },
]

// B 组：P3 扩展色 —— 坐标落在 sRGB 立方体之外，广色域才有意义。
const expanded = [
  { name: 'sRGB 主色（现役）', css: '#cdfa4e', degraded: '#cdfa4e' },
  { name: 'P3 荧光绿（中等）', css: 'color(display-p3 0.70 1.00 0.20)', degraded: '#d0ff64' },
  { name: 'P3 荧光绿（强）', css: 'color(display-p3 0.62 1.00 0.10)', degraded: '#c1ff26' },
]
</script>

<template>
  <div class="gamut-page">
    <NeumorphismScrollbar variant="dots" target=".gamut-page" />
    <div class="content-inner">
      <section class="hero">
        <h1 class="hero-title">色彩能力 · Display P3</h1>
        <p class="hero-lead">
          这一页不解释「什么是广色域」，只回答 ui-frame 该不该用它。
          下面四块内容按顺序读：先看你的设备能做什么，再看三种写法的实际差别。
        </p>
      </section>

      <!-- ① 能力探测 -->
      <section class="section">
        <h2 class="section-title">① 这台设备能做什么</h2>
        <NeumorphismCard class="cap-card">
          <div class="cap-env">
            <span
              >colorDepth <b>{{ env.colorDepth }}</b></span
            >
            <span
              >pixelDepth <b>{{ env.pixelDepth }}</b></span
            >
            <span
              >DPR <b>{{ env.dpr }}</b></span
            >
            <span
              >色域报告 <b>{{ env.gamutLabel }}</b></span
            >
          </div>
          <ul class="cap-list">
            <li v-for="cap in capabilities" :key="cap.key" :class="{ 'cap--yes': cap.supported }">
              <span class="cap-mark">{{ cap.supported ? '✅' : '❌' }}</span>
              <code class="cap-query">{{ cap.label }}</code>
              <span class="cap-note">{{ cap.note }}</span>
            </li>
          </ul>
          <p class="verdict" :class="`verdict--${verdict.level}`">{{ verdict.text }}</p>
        </NeumorphismCard>
      </section>

      <!-- ② 三种写法 -->
      <section class="section">
        <h2 class="section-title">② 同一个颜色，三种写法</h2>
        <p class="section-sub">
          三条都是「同一个青柠色」。区别在于前两条数值来源不同 —— 第 3 条才是正确换算。
        </p>
        <div class="swatch-row">
          <figure v-for="item in sameColor" :key="item.name" class="swatch">
            <div class="swatch-chip" :style="{ background: item.css }" />
            <figcaption>
              <b>{{ item.name }}</b>
              <code>{{ item.css }}</code>
              <span>{{ item.desc }}</span>
            </figcaption>
          </figure>
        </div>
        <p class="callout">
          关键结论：<b>正确换算 = 零视觉变化</b>。把现有 65 个色值全部换算成 P3
          坐标，屏幕上不会有任何区别 —— 因为那些颜色本来就都在 sRGB 立方体内。 换容器不等于换内容。
        </p>
      </section>

      <!-- ③ P3 扩展色 -->
      <section class="section">
        <h2 class="section-title">③ 唯一有真实增益的做法：扩展色</h2>
        <p class="section-sub">
          主动挑选 sRGB 里根本不存在的高饱和坐标。这才是广色域能看见的地方。
        </p>
        <div class="swatch-row">
          <figure v-for="item in expanded" :key="item.name" class="swatch">
            <div class="swatch-chip" :style="{ background: item.css }" />
            <figcaption>
              <b>{{ item.name }}</b>
              <code>{{ item.css }}</code>
              <span
                >不支持 P3 时降级为 <code>{{ item.degraded }}</code></span
              >
            </figcaption>
          </figure>
        </div>
        <p class="callout">
          注意第 2、3 个色块右边那条「降级色」：在 sRGB 屏上它会呈现为降级值， 在 P3
          屏上则多出被裁掉的那一段饱和度。<b>差异只有这一处，量也不大</b>
          —— 因为新拟态界面 49% 的色值是中性灰，P3 对灰色毫无作用。
        </p>
      </section>

      <!-- ④ 守卫必要性 -->
      <section class="section">
        <h2 class="section-title">④ 为什么必须用 @supports 守卫</h2>
        <div class="trap-demo">
          <div class="trap-col">
            <div class="trap-box trap-box--trap">这段文字应该是深色</div>
            <code>color: var(--x)</code>
            <code>--x: 不支持的语法</code>
          </div>
          <div class="trap-col">
            <div class="trap-box trap-box--safe">这段文字应该是深色</div>
            <code>@supports (color: …) { --x: P3 }</code>
            <code>--x: #333 兜底</code>
          </div>
        </div>
        <p class="callout">
          左边是本页真实演示的自定义属性陷阱：<b>自定义属性在解析阶段几乎接受任何值</b>，
          所以浏览器不会丢弃那条声明；等到 `var()` 被替换时才发现值非法， 此时按
          <b>IACVT</b>（invalid at computed-value time）处理 —— 属性变成
          `unset`，也就是继承/初始值。右边加了 `@supports` 才会有正确兜底。
          这条规则适用于**任何**新色彩语法（P3 / oklch / color-mix）。
        </p>
      </section>

      <section class="section">
        <h2 class="section-title">结论</h2>
        <ul class="conclusion">
          <li>
            <b>当前代码：完全没用 P3。</b> ui-frame 与 Panel 两个仓库共 0 处广色域声明， 色值全部是
            sRGB 十六进制 / rgba。
          </li>
          <li>
            <b>但能否使用取决于屏幕，与代码无关。</b> 上面第 ① 块的结果就是这台设备的答案； 换一台
            SDR 显示器打开本页，同一份代码会得到不同结果。
          </li>
          <li>
            <b>收益极小。</b> 新拟态是「低饱和 + 低对比」的语言，49% 色值是中性灰； P3 只影响剩余
            51% 里的高饱和色。而且新拟态靠明暗差塑形，不靠颜色纯度。
          </li>
          <li>
            <b>如果要做，只需一处改动</b>：给主色加一对「P3 增强 + sRGB 兜底」， 用
            <code>@supports (color: color(display-p3 1 1 1))</code> 守卫。
            其余令牌一律不动（灰色换算后完全等值，纯属噪声）。
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../../src/styles/mixins.scss' as *;

.gamut-page {
  height: 100%;
  overflow-y: auto;
  padding: var(--nm-spacing-2xl) var(--nm-spacing-xl);
}

.content-inner {
  max-width: 1040px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-2xl);
}

.hero-title {
  margin: 0 0 var(--nm-spacing-sm);
  font-size: var(--nm-heading-h2-size);
  color: var(--nm-text-primary);
}

.hero-lead,
.section-sub {
  margin: 0;
  max-width: 68ch;
  color: var(--nm-text-secondary);
  font-size: var(--nm-font-md);
  line-height: 1.7;
}

.section-title {
  margin: 0 0 var(--nm-spacing-md);
  font-size: var(--nm-heading-h4-size);
  color: var(--nm-text-primary);
}

// ── 能力清单 ────────────────────────────────────────────────────────────────
.cap-card {
  padding: var(--nm-spacing-lg);
}

.cap-env {
  display: flex;
  flex-wrap: wrap;
  gap: var(--nm-spacing-md);
  padding-bottom: var(--nm-spacing-md);
  margin-bottom: var(--nm-spacing-md);
  border-bottom: 1px solid var(--nm-border-subtle);
  font-size: var(--nm-font-sm);
  color: var(--nm-text-secondary);

  b {
    color: var(--nm-text-primary);
    font-variant-numeric: tabular-nums;
  }
}

.cap-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-xs);
}

.cap-list li {
  display: grid;
  grid-template-columns: 1.4em minmax(11em, auto) 1fr;
  align-items: baseline;
  gap: var(--nm-spacing-sm);
  font-size: var(--nm-font-sm);
  color: var(--nm-text-secondary);
}

.cap-mark {
  font-size: var(--nm-font-sm);
}

.cap-query {
  font-family: var(--nm-font-mono);
  font-size: var(--nm-font-sm);
  color: var(--nm-text-primary);
}

.cap--yes .cap-query {
  color: var(--nm-text-primary);
  font-weight: 600;
}

.cap-note {
  font-size: var(--nm-font-sm);
  color: var(--nm-text-placeholder);
}

.verdict {
  margin: var(--nm-spacing-md) 0 0;
  padding: var(--nm-spacing-sm) var(--nm-spacing-md);
  border-radius: var(--nm-border-radius-sm);
  font-size: var(--nm-font-md);
  background: var(--nm-surface-raised);
  color: var(--nm-text-primary);
}

.verdict--ok {
  border-left: 3px solid var(--nm-color-success);
}

.verdict--warn {
  border-left: 3px solid var(--nm-color-warning);
}

.verdict--bad {
  border-left: 3px solid var(--nm-color-error);
}

// ── 色块 ────────────────────────────────────────────────────────────────────
.swatch-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: var(--nm-spacing-md);
}

.swatch {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-sm);
}

.swatch-chip {
  height: 96px;
  border-radius: var(--nm-border-radius-md);
  border: 1px solid var(--nm-border-subtle);
}

.swatch figcaption {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--nm-font-sm);
  color: var(--nm-text-secondary);

  b {
    color: var(--nm-text-primary);
  }

  code {
    font-family: var(--nm-font-mono);
    font-size: 11px;
    color: var(--nm-text-placeholder);
    word-break: break-all;
  }
}

.callout {
  margin: var(--nm-spacing-md) 0 0;
  padding: var(--nm-spacing-md);
  background: var(--nm-surface-raised);
  border-radius: var(--nm-border-radius-sm);
  font-size: var(--nm-font-md);
  line-height: 1.7;
  color: var(--nm-text-secondary);

  b {
    color: var(--nm-text-primary);
  }

  code {
    font-family: var(--nm-font-mono);
    font-size: 0.92em;
  }
}

// ── IACVT 陷阱演示 ──────────────────────────────────────────────────────────
.trap-demo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: var(--nm-spacing-md);
}

.trap-col {
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-xs);

  code {
    font-family: var(--nm-font-mono);
    font-size: 11px;
    color: var(--nm-text-placeholder);
  }
}

.trap-box {
  padding: var(--nm-spacing-md);
  border-radius: var(--nm-border-radius-sm);
  background: var(--nm-surface-raised);
  font-size: var(--nm-font-md);
}

/* 左边：故意把不支持的语法塞进自定义属性 —— 文本色会被 IACVT 吃掉，
   退回继承值（这里父级是 var(--nm-text-secondary)），肉眼可见地变浅。 */
.trap-box--trap {
  --trap-color: color(display-p3 0.2 0.2 0.2 / 100% 100% 100%);
  color: var(--trap-color);
}

/* 右边：同一目标色，但先给 sRGB 兜底；即使 P3 声明被丢弃也仍然正确。 */
.trap-box--safe {
  --trap-color: #333333;
  color: var(--trap-color);
}

// ── 结论 ────────────────────────────────────────────────────────────────────
.conclusion {
  margin: 0;
  padding-left: 1.2em;
  display: flex;
  flex-direction: column;
  gap: var(--nm-spacing-sm);
  font-size: var(--nm-font-md);
  line-height: 1.75;
  color: var(--nm-text-secondary);

  b {
    color: var(--nm-text-primary);
  }

  code {
    font-family: var(--nm-font-mono);
    font-size: 0.92em;
  }
}

@include nm-mobile-only {
  .gamut-page {
    padding: var(--nm-spacing-lg) var(--nm-spacing-md);
  }

  .content-inner {
    gap: var(--nm-spacing-xl);
  }
}
</style>
