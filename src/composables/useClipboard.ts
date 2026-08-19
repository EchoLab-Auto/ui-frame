import { ref, type Ref } from 'vue'

export interface UseClipboardOptions {
  /** `copied` 状态自动复位的毫秒数（默认 1200） */
  resetDelay?: number
}

export interface UseClipboardReturn {
  /** 上一次复制是否成功（resetDelay 毫秒后自动复位为 false） */
  copied: Ref<boolean>
  /**
   * 复制文本到剪贴板。
   * 成功返回 true；无剪贴板权限 / 非安全上下文 / 环境不支持时返回 false。
   */
  copy: (text: string) => Promise<boolean>
}

/**
 * Headless 剪贴板复制 —— 封装 Clipboard API 调用与"已复制"状态的自动复位。
 * 纯逻辑零渲染，可搭配任意复制按钮 UI 使用。
 *
 * @example
 * ```ts
 * const { copied, copy } = useClipboard()
 * <button @click="copy(text)">{{ copied ? '已复制' : '复制' }}</button>
 * ```
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { resetDelay = 1200 } = options
  const copied = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function copy(text: string): Promise<boolean> {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) return false
      await navigator.clipboard.writeText(text)
      copied.value = true
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        copied.value = false
      }, resetDelay)
      return true
    } catch {
      // 剪贴板不可用（权限拒绝 / 非安全上下文）——静默失败
      return false
    }
  }

  return { copied, copy }
}
