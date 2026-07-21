/**
 * Magnetic hover directive — tilts and shifts elements toward the cursor
 * for a tactile neumorphic feel.
 *
 * Usage: <button v-nm-magnetic>Hover me</button>
 * Options: v-nm-magnetic="{ strength: 6, rotation: 3 }"
 *
 * Auto-disabled on touch devices and when prefers-reduced-motion is set.
 */

import type { Directive, DirectiveBinding } from 'vue'
import { prefersReducedMotion } from '../composables/useReducedMotion'

interface MagneticOptions {
  /** Max translate in px (default: 6) */
  strength?: number
  /** Max rotation in degrees (default: 3) */
  rotation?: number
}

interface MagneticState {
  onMouseMove: (e: MouseEvent) => void
  onMouseLeave: () => void
  rafId: number | null
  originalTransform: string
}

const stateMap = new WeakMap<HTMLElement, MagneticState>()

function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
}

export const vMagnetic: Directive<HTMLElement, MagneticOptions | undefined> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<MagneticOptions | undefined>) {
    // Skip on touch devices and reduced-motion preference
    if (isTouchDevice() || prefersReducedMotion()) return

    const options = binding.value ?? {}
    const strength = options.strength ?? 6
    const rotation = options.rotation ?? 3

    const originalTransform = el.style.transform || ''
    let rafId: number | null = null

    function onMouseMove(e: MouseEvent) {
      if (rafId) return // throttle to one rAF per frame
      rafId = requestAnimationFrame(() => {
        rafId = null
        const rect = el.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const offsetX = (e.clientX - centerX) / (rect.width / 2)
        const offsetY = (e.clientY - centerY) / (rect.height / 2)

        const tx = offsetX * strength
        const ty = offsetY * strength
        const rx = -offsetY * rotation
        const ry = offsetX * rotation

        el.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`
        el.style.transition = 'transform 0.1s ease-out'
      })
    }

    function onMouseLeave() {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      el.style.transform = originalTransform
      el.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }

    el.addEventListener('mousemove', onMouseMove, { passive: true })
    el.addEventListener('mouseleave', onMouseLeave)

    stateMap.set(el, { onMouseMove, onMouseLeave, rafId, originalTransform })
  },

  unmounted(el: HTMLElement) {
    const state = stateMap.get(el)
    if (!state) return
    el.removeEventListener('mousemove', state.onMouseMove)
    el.removeEventListener('mouseleave', state.onMouseLeave)
    if (state.rafId) cancelAnimationFrame(state.rafId)
    stateMap.delete(el)
  },
}

export default vMagnetic
