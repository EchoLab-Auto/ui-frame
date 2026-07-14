<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export type ScrollbarVariant = 'standard' | 'minimal' | 'primary' | 'none' | 'dots'

const props = withDefaults(
  defineProps<{
    variant?: ScrollbarVariant
    target?: string
    dotColor?: string
    accentColor?: string
    sigma?: number
  }>(),
  {
    variant: 'standard',
    target: '.nm-layout__content',
    dotColor: '153,153,153',
    accentColor: '205,250,78',
    sigma: 14,
  }
)

const isDots = computed(() => props.variant === 'dots')

// ==================== CSS-class variants ====================
let targetEl: HTMLElement | null = null

function applyClass(cls: string) {
  if (!targetEl) return
  const existing = Array.from(targetEl.classList).filter(c => c.startsWith('nm-scrollbar--'))
  existing.forEach(c => targetEl!.classList.remove(c))
  targetEl.classList.add(cls)
}

watch([() => props.variant, () => props.target], () => {
  if (isDots.value) return
  targetEl = document.querySelector(props.target)
  if (targetEl) applyClass(`nm-scrollbar--${props.variant}`)
})

onMounted(() => {
  if (!isDots.value) {
    targetEl = document.querySelector(props.target)
    if (targetEl) applyClass(`nm-scrollbar--${props.variant}`)
  }
})

onUnmounted(() => {
  if (targetEl) {
    const existing = Array.from(targetEl.classList).filter(c => c.startsWith('nm-scrollbar--'))
    existing.forEach(c => targetEl!.classList.remove(c))
    targetEl = null
  }
})

// ==================== Dots variant ====================
const scrollY = ref(0)
const overlayTop = ref(0)
const overlayH = ref(window.innerHeight)
const overlayDocH = ref(1000)
let el: HTMLElement | null = null
let styleId: string | null = null

function syncRect() {
  if (!el) return
  const r = el.getBoundingClientRect()
  overlayTop.value = r.top
  overlayH.value = r.height
}

function onScroll() {
  if (!el) return
  scrollY.value = el.scrollTop
  overlayDocH.value = el.scrollHeight
  syncRect()
}

function injectHider(selector: string) {
  const id = `nm-sb-hide-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`
  if (document.getElementById(id)) return
  const s = document.createElement('style')
  s.id = id
  s.textContent = `${selector}{scrollbar-width:none}${selector}::-webkit-scrollbar{display:none}`
  document.head.appendChild(s)
  styleId = id
}

function removeHider() {
  if (styleId) {
    const s = document.getElementById(styleId)
    if (s) s.remove()
    styleId = null
  }
}

function onGlobalScroll() {
  syncRect()
}

function startDots() {
  el = document.querySelector(props.target)
  if (el) {
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    injectHider(props.target)
  }
  window.addEventListener('scroll', onGlobalScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
}

function stopDots() {
  if (el) el.removeEventListener('scroll', onScroll)
  window.removeEventListener('scroll', onGlobalScroll)
  window.removeEventListener('resize', onScroll)
  removeHider()
  el = null
}

watch(isDots, on => {
  if (on) startDots()
  else stopDots()
})

onMounted(() => {
  if (isDots.value) startDots()
})

onUnmounted(() => {
  if (isDots.value) stopDots()
})

const bgImage = computed(() => {
  const h = overlayH.value
  const maxScroll = overlayDocH.value - h
  const progress = maxScroll > 0 ? scrollY.value / maxScroll : 0
  const cursorY = progress * h
  const s = props.sigma

  const rows = Math.ceil(h / 5)
  const layers: string[] = []

  const [dR, dG, dB] = props.dotColor.split(',').map(Number)
  const [aR, aG, aB] = props.accentColor.split(',').map(Number)

  for (let i = 0; i < rows; i++) {
    const y = i * 5 + 2.5
    const dist = Math.abs(y - cursorY)
    const t = Math.exp(-(dist * dist) / (2 * s * s))
    const r = Math.round(dR + (aR - dR) * t)
    const g = Math.round(dG + (aG - dG) * t)
    const b = Math.round(dB + (aB - dB) * t)
    const a = (0.3 + 0.7 * t).toFixed(2)
    const c = `rgba(${r},${g},${b},${a})`

    for (let j = 0; j < 5; j++) {
      const cx = 2.5 + j * 5
      layers.push(`radial-gradient(circle at ${cx}px ${y}px, ${c} 1px, transparent 1.1px)`)
    }
  }
  return layers.join(',\n')
})
</script>

<template>
  <div
    v-if="isDots"
    :style="{
      position: 'fixed',
      right: '4px',
      top: `${overlayTop}px`,
      height: `${overlayH}px`,
      width: '25px',
      zIndex: 99999,
      backgroundImage: bgImage,
      backgroundSize: `25px ${overlayH}px`,
      backgroundRepeat: 'no-repeat',
      pointerEvents: 'none',
    }"
  />
</template>
