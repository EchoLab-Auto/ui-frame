/**
 * 容器内容宽度测量（文档图表用）。
 *
 * 为什么不用现成的 `useChart`：那个组合式函数把"数据 + 尺寸 + 悬停状态"绑在一起，
 * 而文档图表要的只是**一个宽度数字**——布局是纯函数（宽度进去、坐标出来），
 * 少一层耦合，图表在 SSR（测不到宽度）与单测（无 ResizeObserver）里都能给出
 * 确定结果。
 *
 * `width` 已经是"可用宽度"：**不小于 `minWidth`**。所以调用方不必再判 0——
 * 初始帧、SSR、jsdom 里全都落回最小宽度，不会画出 0 宽的图。
 */
import { computed, onBeforeUnmount, onMounted, ref, type ComputedRef, type Ref } from 'vue'

export interface UseContainerWidthOptions {
  /** 测不到宽度时的兜底（也作为布局下限：图表再窄也不会挤成一团） */
  minWidth: number
}

export interface ContainerWidth {
  /** 可直接参与布局的宽度（≥ minWidth） */
  width: ComputedRef<number>
  /** 原始测量值（0 = 还没测到；诊断用） */
  measured: Ref<number>
}

export function useContainerWidth(
  target: Ref<HTMLElement | null>,
  options: UseContainerWidthOptions
): ContainerWidth {
  const measured = ref(0)
  let observer: ResizeObserver | null = null

  function read(): void {
    const el = target.value
    if (!el) return
    // content-box（扣掉 padding）：图表可用宽度不含容器内边距
    const style = getComputedStyle(el)
    const paddingLeft = Number.parseFloat(style.paddingLeft) || 0
    const paddingRight = Number.parseFloat(style.paddingRight) || 0
    const next = el.clientWidth - paddingLeft - paddingRight
    if (next > 0) measured.value = next
  }

  onMounted(() => {
    read()
    // happy-dom / SSR 没有 ResizeObserver：没有就只测首帧，绝不报错。
    if (typeof ResizeObserver === 'undefined' || !target.value) return
    observer = new ResizeObserver(() => read())
    observer.observe(target.value)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return {
    width: computed(() => Math.max(options.minWidth, measured.value)),
    measured,
  }
}
