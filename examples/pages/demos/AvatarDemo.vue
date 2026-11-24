<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type AvatarShape = 'circle' | 'rounded'

// ---- 配置台状态 ----
/**
 * 尺寸只有一个量：**直径 px**。
 *
 * 2026-11 起 `size` 直接收 px（数字 size 的语义就是直径），不再有"小/中/大"档位，
 * 所以不需要"档位 + 滑块"两级——档位时代要维护「切档时把滑块拨到该档默认值」和
 * 「把直径写进当前档的 token」，现在一个数就是全部信息。
 */
const size = ref(44)
/** 形状只有 circle / rounded 两档（源码 `shape?: 'circle' | 'rounded'`，没有 square） */
const shape = ref<AvatarShape>('circle')
const diameter = size
const initials = ref('JD')
const src = ref('')
const alt = ref('用户')

/** 常用直径（原三档锚点 32 / 44 / 64）当快捷取值 */
const sizeOptions = [
  { label: '32', value: 32 },
  { label: '44', value: 44 },
  { label: '64', value: 64 },
]
const shapeOptions = [
  { label: '圆形', value: 'circle' },
  { label: '圆角方形', value: 'rounded' },
]

/** 当前是否走图片模式：`src` 为空即纯首字母头像（组件的 `hasImage` 就是 `!!src`） */
const imageMode = computed(() => src.value.length > 0)

function reset() {
  size.value = 44
  shape.value = 'circle'
  initials.value = 'JD'
  src.value = ''
  alt.value = '用户'
}

// ---- 实时代码片段 ----
const snippet = computed(() => {
  const attrs: string[] = []
  if (src.value) attrs.push(`src="${src.value}"`)
  if (initials.value) attrs.push(`initials="${initials.value}"`)
  if (alt.value) attrs.push(`alt="${alt.value}"`)
  if (size.value !== 44) attrs.push(`:size="${size.value}"`)
  if (shape.value !== 'circle') attrs.push(`shape="${shape.value}"`)
  return attrs.length ? `<NeumorphismAvatar ${attrs.join(' ')} />` : '<NeumorphismAvatar />'
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <NeumorphismAvatar :src="src" :initials="initials" :alt="alt" :size="size" :shape="shape" />

      <template #spec>
        size=<b>{{ size }}px</b> · shape=<b>{{ shape }}</b> · 模式=<b>{{
          imageMode ? '图片' : '首字母'
        }}</b>
      </template>

      <template #hint>
        形状只有 <code>circle</code> / <code>rounded</code> 两档（没有 <code>square</code>）；
        图片加载失败会静默回退到首字母，并对外抛 <code>@error</code>。
      </template>

      <template #config>
        <DemoField label="尺寸 size">
          <NeumorphismSegmented v-model="size" :options="sizeOptions" :size="26" />
        </DemoField>

        <DemoField label="形状 shape">
          <NeumorphismSegmented v-model="shape" :options="shapeOptions" :size="26" />
        </DemoField>

        <DemoField label="直径" :value="`${diameter}px`" grow>
          <NeumorphismSlider v-model="diameter" :min="28" :max="96" :step="4" :size="6" />
        </DemoField>

        <DemoField label="首字母 initials">
          <NeumorphismInput v-model="initials" :size="36" placeholder="JD（只取前 2 位）" />
        </DemoField>

        <DemoField label="图片 src">
          <NeumorphismInput v-model="src" :size="36" placeholder="留空 = 纯首字母" />
        </DemoField>

        <DemoField label="替代文本 alt">
          <NeumorphismInput v-model="alt" :size="36" placeholder="用户" />
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" :size="32" @click="reset()"
            >恢复默认</NeumorphismButton
          >
          <NeumorphismButton
            variant="pressed"
            :size="32"
            @click="src = 'https://i.pravatar.cc/64?img=1'"
          >
            示例图
          </NeumorphismButton>
          <NeumorphismButton
            variant="pressed"
            :size="32"
            @click="src = 'https://invalid.url/img.jpg'"
          >
            失效图
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
