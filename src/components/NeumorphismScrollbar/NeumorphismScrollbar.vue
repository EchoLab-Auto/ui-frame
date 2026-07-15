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
const overlayH = ref(100)
const overlayDocH = ref(1000)
let el: HTMLElement | null = null
let overlayEl: HTMLDivElement | null = null
let styleId: string | null = null

function updateOverlayHeight() {
  if (!el) return
  overlayH.value = el.clientHeight
  if (overlayEl) overlayEl.style.height = `${overlayH.value}px`
}

function onScroll() {
  if (!el) return
  scrollY.value = el.scrollTop
  overlayDocH.value = el.scrollHeight
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

function startDots() {
  el = document.querySelector(props.target)
  if (!el) return
  el.addEventListener('scroll', onScroll, { passive: true })
  injectHider(props.target)
  window.addEventListener('resize', updateOverlayHeight, { passive: true })

  // Zero-height sticky wrapper — occupies no vertical space in flow
  // but stays pinned to the top while scrolling.
  const wrapper = document.createElement('div')
  wrapper.style.cssText =
    'position:sticky;top:0;margin-left:auto;margin-right:4px;width:25px;height:0;z-index:1'
  // Dots overlay — absolute within the wrapper, rendered at full container height
  // so the dot pattern spans the entire scrollable area without pushing content.
  overlayEl = document.createElement('div')
  overlayEl.style.cssText = 'position:absolute;right:0;top:0;width:25px;pointer-events:none'
  overlayEl.style.height = `${overlayH.value}px`
  wrapper.appendChild(overlayEl)
  el.insertBefore(wrapper, el.firstChild)

  onScroll()
  updateOverlayHeight()
}

function stopDots() {
  if (el) el.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', updateOverlayHeight)
  removeHider()
  if (overlayEl) {
    overlayEl.parentElement?.remove() // remove the sticky wrapper
    overlayEl = null
  }
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

// Sync computed background to DOM overlay
watch(bgImage, val => {
  if (overlayEl) {
    overlayEl.style.backgroundImage = val
    overlayEl.style.backgroundSize = `25px ${overlayH.value}px`
    overlayEl.style.backgroundRepeat = 'no-repeat'
  }
})
</script>

<template>
  <span v-if="false" />
</template>
