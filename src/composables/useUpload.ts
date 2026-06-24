import { ref, onBeforeUnmount, type Ref, type ComputedRef } from 'vue'
import { generateId } from '@/utils'

export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error'

export interface UploadFile {
  /** Unique identifier */
  id: string
  /** Original file name */
  name: string
  /** File size in bytes */
  size: number
  /** MIME type */
  type: string
  /** Upload lifecycle status */
  status: UploadStatus
  /** Upload progress (0–100) */
  progress: number
  /** ObjectURL for image preview (cleaned up on remove) */
  url?: string
  /** Error message if status === 'error' */
  error?: string
  /** Raw File object reference */
  raw?: File
}

export interface UseUploadOptions {
  /** Accepted MIME types / extensions, e.g. "image/*,.pdf" */
  accept?: Ref<string | undefined> | ComputedRef<string | undefined>
  /** Maximum file size in bytes */
  maxSize?: Ref<number | undefined> | ComputedRef<number | undefined>
  /** Maximum number of files allowed */
  maxCount?: Ref<number | undefined> | ComputedRef<number | undefined>
  /** Whether multiple files can be selected */
  multiple?: Ref<boolean> | ComputedRef<boolean>
  /** Automatically start upload after file selection */
  autoUpload?: Ref<boolean> | ComputedRef<boolean>
  /** Callback when file count exceeds maxCount */
  onExceed?: (excessCount: number) => void
  /** Callback when file size exceeds maxSize */
  onSizeExceed?: (file: File) => void
  /** Callback when file type is not accepted */
  onTypeError?: (file: File) => void
  /** Custom upload function — receives file, returns a promise resolving to progress (0–100) or void */
  uploadFn?: (file: UploadFile) => Promise<void>
}

export interface UseUploadReturn {
  /** Current file list */
  files: Ref<UploadFile[]>
  /** Whether a drag operation is hovering over the drop zone */
  dragOver: Ref<boolean>
  /** Add files to the list (validates first) */
  addFiles: (fileList: FileList | File[]) => void
  /** Remove a single file by id — cleans up ObjectURL */
  removeFile: (id: string) => void
  /** Clear all files — cleans up all ObjectURLs */
  clearFiles: () => void
  /** Manually trigger upload for pending files */
  upload: () => Promise<void>
  /** Hidden file input element ref */
  fileInputRef: Ref<HTMLInputElement | null>
  /** Set dragOver to true on dragover/enter */
  handleDrag: (event: DragEvent) => void
  /** Reset dragOver counter on dragleave */
  handleDragLeave: (event: DragEvent) => void
  /** Add files from drop event, reset dragOver */
  handleDrop: (event: DragEvent) => void
  /** Open file picker dialog */
  handleFileInput: (event: Event) => void
}

/**
 * Headless upload — encapsulates file selection, validation, drag-and-drop
 * tracking, upload progress simulation, and ObjectURL lifecycle management.
 * Use with your own UI rendering.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useUpload } from '@echolab/ui-frame'
 * const { files, dragOver, fileInputRef, addFiles, removeFile, clearFiles, upload, handleDrag, handleDrop, handleFileInput } = useUpload({})
 * </script>
 * ```
 */
export function useUpload(opts: UseUploadOptions = {}): UseUploadReturn {
  const {
    accept,
    maxSize,
    maxCount,
    multiple,
    autoUpload,
    onExceed,
    onSizeExceed,
    onTypeError,
    uploadFn,
  } = opts

  const files = ref<UploadFile[]>([])
  const dragOver = ref(false)
  const fileInputRef = ref<HTMLInputElement | null>(null)
  let dragCounter = 0

  // ---- helpers -----------------------------------------------------------

  function isAcceptMatch(fileType: string, acceptStr: string): boolean {
    const patterns = acceptStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    return patterns.some(pattern => {
      // MIME type with wildcard: "image/*"
      if (pattern.endsWith('/*')) {
        const prefix = pattern.slice(0, -1)
        return fileType.startsWith(prefix)
      }
      // Extension: ".pdf"
      if (pattern.startsWith('.')) {
        return fileType.endsWith(pattern) || fileType === pattern.toLowerCase()
      }
      // Exact MIME match
      return fileType === pattern
    })
  }

  function createObjectURL(file: File): string {
    try {
      return URL.createObjectURL(file)
    } catch {
      return ''
    }
  }

  function revokeObjectURL(url?: string) {
    if (url) {
      try {
        URL.revokeObjectURL(url)
      } catch {
        // best effort cleanup
      }
    }
  }

  function validateFile(file: File): string | null {
    // Size check
    if (maxSize?.value && file.size > maxSize.value) {
      onSizeExceed?.(file)
      return 'sizeExceed'
    }
    // Type check
    if (accept?.value && file.type) {
      if (!isAcceptMatch(file.type, accept.value)) {
        // Also check extension for files without MIME or flat mappings
        const ext = `.${file.name.split('.').pop()?.toLowerCase()}`
        if (!isAcceptMatch(ext, accept.value)) {
          onTypeError?.(file)
          return 'typeError'
        }
      }
    }
    return null
  }

  function toUploadFile(file: File): UploadFile {
    const url = file.type.startsWith('image/') ? createObjectURL(file) : undefined
    return {
      id: generateId('upload_'),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
      url,
      raw: file,
    }
  }

  // ---- public API --------------------------------------------------------

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList)
    const isMultiple = multiple?.value ?? false
    const max = maxCount?.value

    // Exceed check
    if (max !== undefined) {
      const totalAfter = files.value.length + incoming.length
      if (totalAfter > max) {
        onExceed?.(totalAfter - max)
        // Trim incoming to fit
        const allowed = max - files.value.length
        if (allowed <= 0) return
        incoming.splice(allowed)
      }
    }

    // If not multiple, only keep last file
    if (!isMultiple) {
      clearFiles()
    }

    const valid: UploadFile[] = []
    for (const file of incoming) {
      const err = validateFile(file)
      if (err) {
        // Still add file but mark as error
        const uf: UploadFile = {
          id: generateId('upload_'),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'error',
          progress: 0,
          error: err === 'sizeExceed' ? 'sizeExceed' : 'typeError',
        }
        valid.push(uf)
      } else {
        valid.push(toUploadFile(file))
      }
    }

    files.value = [...files.value, ...valid]

    if (autoUpload?.value && valid.some(f => f.status === 'pending')) {
      upload()
    }
  }

  function removeFile(id: string) {
    const idx = files.value.findIndex(f => f.id === id)
    if (idx === -1) return
    const file = files.value[idx]
    revokeObjectURL(file.url)
    files.value = files.value.filter(f => f.id !== id)
  }

  function clearFiles() {
    for (const f of files.value) {
      revokeObjectURL(f.url)
    }
    files.value = []
  }

  /**
   * Simulated upload progress. If a custom `uploadFn` is provided it is
   * used instead. Otherwise each pending file receives a simple interval-
   * based progress ramp from 0 → 100 at ~20 %/tick.
   */
  async function upload(): Promise<void> {
    const pending = files.value.filter(f => f.status === 'pending')
    for (const f of pending) {
      f.status = 'uploading'
      f.progress = 0
    }

    if (uploadFn) {
      // Use caller-supplied upload logic
      await Promise.allSettled(
        pending.map(async f => {
          try {
            await uploadFn(f)
            f.status = 'done'
            f.progress = 100
          } catch (err: unknown) {
            f.status = 'error'
            f.error = err instanceof Error ? err.message : 'uploadFail'
          }
        })
      )
      return
    }

    // Default simulated progress
    await Promise.allSettled(
      pending.map(
        f =>
          new Promise<void>(resolve => {
            const interval = setInterval(() => {
              if (f.status !== 'uploading') {
                clearInterval(interval)
                return
              }
              f.progress = Math.min(100, f.progress + 15 + Math.random() * 10)
              if (f.progress >= 100) {
                clearInterval(interval)
                f.status = 'done'
                resolve()
              }
            }, 300)
          })
      )
    )
  }

  // ---- drag-and-drop handlers --------------------------------------------

  function handleDrag(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (event.type === 'dragover' || event.type === 'dragenter') {
      dragCounter++
      dragOver.value = true
    }
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    dragCounter = Math.max(0, dragCounter - 1)
    if (dragCounter === 0) {
      dragOver.value = false
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    dragOver.value = false
    dragCounter = 0
    const dt = event.dataTransfer
    if (dt?.files && dt.files.length > 0) {
      addFiles(dt.files)
    }
  }

  function handleFileInput(event: Event) {
    const target = event.target as HTMLInputElement | null
    if (target?.files && target.files.length > 0) {
      addFiles(target.files)
      // Reset so re-selecting the same file triggers change again
      target.value = ''
    }
  }

  // ---- cleanup -----------------------------------------------------------

  onBeforeUnmount(() => {
    for (const f of files.value) {
      revokeObjectURL(f.url)
    }
  })

  return {
    files,
    dragOver,
    addFiles,
    removeFile,
    clearFiles,
    upload,
    fileInputRef,
    handleDrag,
    handleDragLeave,
    handleDrop,
    handleFileInput,
  }
}
