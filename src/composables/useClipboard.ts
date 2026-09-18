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

  /** execCommand 兜底：非安全上下文（局域网 http）无 navigator.clipboard。 */
  function execCommandCopy(text: string): boolean {
    if (typeof document === 'undefined') return false
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      textarea.remove()
    }
  }

  function markCopied() {
    copied.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      copied.value = false
    }, resetDelay)
  }

  async function copy(text: string): Promise<boolean> {
    // 优先 Clipboard API；不可用或抛错（权限拒绝/非安全上下文）时回退
    // textarea + execCommand —— 否则局域网 http 访问下复制按钮静默失效。
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        markCopied()
        return true
      }
    } catch {
      // fall through to execCommand fallback
    }
    if (execCommandCopy(text)) {
      markCopied()
      return true
    }
    return false
  }

  return { copied, copy }
}
