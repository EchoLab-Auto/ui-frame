<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'
import { DocCodeBlock } from '../../../src/composites/doc'

type CodeLang = 'ts' | 'bash' | 'json' | 'vue'

// ---- 配置台状态 ----
const codeLang = ref<CodeLang>('ts')
const codeShowLineNumbers = ref(true)

/** 原卡片里的 TypeScript 示例，作为 ts 档的默认内容 */
const codeDemoTs = `// 快速开始
import { createApp } from 'vue'
import NeumorphismUI from '@echolab-auto/ui-frame'

const app = createApp(App)
app.use(NeumorphismUI)`

/** bash 档：原卡片的安装命令 + 一条常用脚本 */
const codeDemoBash = `npm install @echolab-auto/ui-frame
npm run dev`

const codeSamples: Record<CodeLang, string> = {
  ts: codeDemoTs,
  bash: codeDemoBash,
  json: `{
  "name": "my-app",
  "dependencies": { "vue": "^3.5.0" }
}`,
  // 注意：样例里不能出现 script 结束标签，它会被 SFC 解析器当成脚本块结尾
  vue: `<template>
  <NeumorphismButton variant="primary">你好</NeumorphismButton>
</template>`,
}

const codeContent = ref(codeDemoTs)

const langOptions = [
  { label: 'TS', value: 'ts' },
  { label: 'bash', value: 'bash' },
  { label: 'JSON', value: 'json' },
  { label: 'Vue', value: 'vue' },
]

/**
 * 切语言时载入该语言的样例。
 *
 * 高亮是按 fence 标识走的：把 ts 代码丢给 bash 解析器只会得到一片"没高亮"，
 * 看不出这个参数到底在做什么，所以换语言顺手换一段同语言的真代码。
 */
watch(codeLang, lang => {
  codeContent.value = codeSamples[lang]
})

function reset() {
  codeLang.value = 'ts'
  codeShowLineNumbers.value = true
  codeContent.value = codeDemoTs
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs = [':code="code"', `lang="${codeLang.value}"`]
  // showLineNumbers 默认 true，只有关掉时才需要写出来
  if (!codeShowLineNumbers.value) attrs.push(':show-line-numbers="false"')
  return `<DocCodeBlock ${attrs.join(' ')} />`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet" :stage-switch="false">
      <DocCodeBlock
        :code="codeContent"
        :lang="codeLang"
        :show-line-numbers="codeShowLineNumbers"
        style="width: 100%"
      />

      <template #spec>
        lang=<b>{{ codeLang }}</b> · showLineNumbers=<b>{{ codeShowLineNumbers }}</b> · 行数=<b>{{
          codeContent.split('\n').length
        }}</b>
      </template>

      <template #hint>
        语言标记决定两件事：<strong>是否高亮</strong>（<code>text</code> / <code>plain</code> / 不传
        → 只做 HTML 转义）与<strong>行注释风格</strong>（C 系 <code>//</code>、<code>#</code>
        系、SQL 的 <code>--</code>）。关键字表由各语言共用，所以 ts / json / vue 都能出彩色。
        行号与代码是两列独立容器，正文横向滚动时行号不动。
      </template>

      <template #config>
        <DemoField label="语言 lang">
          <NeumorphismSegmented v-model="codeLang" :options="langOptions" size="small" />
        </DemoField>

        <DemoField label="行号">
          <label class="demo-toggle">
            <NeumorphismSwitch v-model="codeShowLineNumbers" size="small" />
            <span>showLineNumbers</span>
          </label>
        </DemoField>

        <DemoField label="代码 code" label-width="78px">
          <NeumorphismTextarea v-model="codeContent" :rows="5" size="small" style="width: 100%" />
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
          <NeumorphismButton variant="pressed" size="small" @click="codeShowLineNumbers = false">
            关掉行号
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">两种典型用法：TypeScript（带行号）+ bash（无行号、一键复制）</h4>
    <div class="demo-row" style="gap: 24px; align-items: flex-start">
      <div style="flex: 1 1 320px; min-width: 300px">
        <h4 class="demo-label">TypeScript（带行号）</h4>
        <DocCodeBlock :code="codeDemoTs" lang="ts" />
      </div>
      <div style="flex: 1 1 320px; min-width: 300px">
        <h4 class="demo-label">bash（无行号）</h4>
        <DocCodeBlock
          code="npm install @echolab-auto/ui-frame"
          lang="bash"
          :show-line-numbers="false"
        />
      </div>
    </div>
    <p class="demo-hint">
      右上角的复制按钮走 <code>useClipboard</code>，复制成功后按钮文案会切到「已复制」并在 1.5s
      后复位——一行 shell 命令不需要行号，关掉后左侧整块留白也跟着收掉。
    </p>
  </div>
</template>
