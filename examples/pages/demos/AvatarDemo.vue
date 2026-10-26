<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DemoPlayground, DemoField } from '../../demo'

type AvatarSize = 'small' | 'medium' | 'large'
type AvatarShape = 'circle' | 'rounded'

/** 三档的默认直径，与 tokens.scss 里的 `--nm-avatar-size-*` 保持一致 */
const TIER_DIAMETER: Record<AvatarSize, number> = { small: 32, medium: 44, large: 64 }

// ---- 配置台状态 ----
const size = ref<AvatarSize>('medium')
/** 形状只有 circle / rounded 两档（源码 `shape?: 'circle' | 'rounded'`，没有 square） */
const shape = ref<AvatarShape>('circle')
const diameter = ref(TIER_DIAMETER.medium)
const initials = ref('JD')
const src = ref('')
const alt = ref('用户')

const sizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]
const shapeOptions = [
  { label: '圆形', value: 'circle' },
  { label: '圆角方形', value: 'rounded' },
]

/**
 * 切档位时把滑块拨到该档自己的默认直径。
 *
 * 否则「大档 + 44px」看上去和「中档 + 44px」一模一样，会让人以为档位没生效——
 * 档位决定的本来就是三组不同的 token 起点，直径滑块是在起点上再微调。
 */
watch(size, tier => {
  diameter.value = TIER_DIAMETER[tier]
})

/**
 * 直径 / 字号写到**当前档位**的 token 上。
 *
 * 组件每个档位各消费一组 `--nm-avatar-size-{sm,md,lg}` 与 `--nm-avatar-font-{sm,md,lg}`
 * （见组件样式 `.nm-avatar--small|medium|large`），写死 md 的话切到小/大档滑块会静默失效。
 * 字号按 16/44 的原生比例跟着直径走，避免「大头像配小字」。
 */
const sizeVars = computed<Record<string, string>>(() => {
  const suffix = size.value === 'small' ? 'sm' : size.value === 'large' ? 'lg' : 'md'
  return {
    [`--nm-avatar-size-${suffix}`]: `${diameter.value}px`,
    [`--nm-avatar-font-${suffix}`]: `${Math.max(10, Math.round((16 * diameter.value) / 44))}px`,
  }
})

/** 当前是否走图片模式：`src` 为空即纯首字母头像（组件的 `hasImage` 就是 `!!src`） */
const imageMode = computed(() => src.value.length > 0)

function reset() {
  size.value = 'medium'
  shape.value = 'circle'
  diameter.value = TIER_DIAMETER.medium
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
  if (size.value !== 'medium') attrs.push(`size="${size.value}"`)
  if (shape.value !== 'circle') attrs.push(`shape="${shape.value}"`)
  const tag = attrs.length ? `<NeumorphismAvatar ${attrs.join(' ')} />` : '<NeumorphismAvatar />'
  // 直径不是该档默认值时，只能靠 token 变量调——组件没有 px 数值入口，注释说明怎么改
  const custom =
    diameter.value !== TIER_DIAMETER[size.value]
      ? `\n<!-- 直径只能经 token 覆盖：--nm-avatar-size-* → ${diameter.value}px -->`
      : ''
  return `${tag}${custom}`
})
</script>

<template>
  <div class="demo-block">
    <h4 class="demo-label">展示 + 配置（左侧实时预览，右侧调整参数）</h4>
    <DemoPlayground :snippet="snippet">
      <NeumorphismAvatar
        :src="src"
        :initials="initials"
        :alt="alt"
        :size="size"
        :shape="shape"
        :style="sizeVars"
      />

      <template #spec>
        size=<b>{{ size }}</b> · shape=<b>{{ shape }}</b> · 直径=<b>{{ diameter }}px</b> · 模式=<b
          >{{ imageMode ? '图片' : '首字母' }}</b
        >
      </template>

      <template #hint>
        形状只有 <code>circle</code> / <code>rounded</code> 两档（没有 <code>square</code>）；
        图片加载失败会静默回退到首字母，并对外抛 <code>@error</code>。
      </template>

      <template #config>
        <DemoField label="尺寸 size">
          <NeumorphismSegmented v-model="size" :options="sizeOptions" size="small" />
        </DemoField>

        <DemoField label="形状 shape">
          <NeumorphismSegmented v-model="shape" :options="shapeOptions" size="small" />
        </DemoField>

        <DemoField label="直径" :value="`${diameter}px`" grow>
          <NeumorphismSlider v-model="diameter" :min="28" :max="96" :step="4" size="small" />
        </DemoField>

        <DemoField label="首字母 initials">
          <NeumorphismInput v-model="initials" size="small" placeholder="JD（只取前 2 位）" />
        </DemoField>

        <DemoField label="图片 src">
          <NeumorphismInput v-model="src" size="small" placeholder="留空 = 纯首字母" />
        </DemoField>

        <DemoField label="替代文本 alt">
          <NeumorphismInput v-model="alt" size="small" placeholder="用户" />
        </DemoField>

        <DemoField label="操作">
          <NeumorphismButton variant="raised" size="small" @click="reset()"
            >恢复默认</NeumorphismButton
          >
          <NeumorphismButton
            variant="pressed"
            size="small"
            @click="src = 'https://i.pravatar.cc/64?img=1'"
          >
            示例图
          </NeumorphismButton>
          <NeumorphismButton
            variant="pressed"
            size="small"
            @click="src = 'https://invalid.url/img.jpg'"
          >
            失效图
          </NeumorphismButton>
        </DemoField>
      </template>
    </DemoPlayground>
  </div>
</template>
