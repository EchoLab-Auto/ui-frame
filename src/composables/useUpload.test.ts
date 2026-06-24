import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useUpload } from './useUpload'

function createFile(name = 'test.txt', size = 1024, type = 'text/plain'): File {
  return new File(['x'.repeat(size)], name, { type })
}

describe('useUpload', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('initialises with empty files and dragOver false', () => {
    const { files, dragOver } = useUpload()
    expect(files.value).toEqual([])
    expect(dragOver.value).toBe(false)
  })

  it('addFiles appends files to the list', () => {
    const { files, addFiles } = useUpload()
    const file = createFile()
    addFiles([file])
    expect(files.value).toHaveLength(1)
    expect(files.value[0].name).toBe('test.txt')
    expect(files.value[0].size).toBe(1024)
    expect(files.value[0].status).toBe('pending')
  })

  it('addFiles generates unique ids', () => {
    const { files, addFiles } = useUpload()
    addFiles([createFile('a.txt'), createFile('b.txt')])
    expect(files.value).toHaveLength(2)
    expect(files.value[0].id).not.toBe(files.value[1].id)
  })

  it('addFiles creates ObjectURL for image files', () => {
    const { files, addFiles } = useUpload()
    addFiles([createFile('photo.png', 2048, 'image/png')])
    expect(files.value[0].url).toBeDefined()
    expect(files.value[0].url).toContain('blob:')
  })

  it('addFiles does not create ObjectURL for non-image files', () => {
    const { files, addFiles } = useUpload()
    addFiles([createFile('doc.pdf', 4096, 'application/pdf')])
    expect(files.value[0].url).toBeUndefined()
  })

  it('removeFile removes a single file and revokes ObjectURL', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')
    const { files, addFiles, removeFile } = useUpload()
    addFiles([createFile('img.png', 512, 'image/png')])
    const url = files.value[0].url!
    removeFile(files.value[0].id)
    expect(files.value).toHaveLength(0)
    expect(revokeSpy).toHaveBeenCalledWith(url)
  })

  it('clearFiles removes all files and revokes all ObjectURLs', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')
    const { files, addFiles, clearFiles } = useUpload()
    addFiles([createFile('a.png', 100, 'image/png'), createFile('b.png', 200, 'image/png')])
    clearFiles()
    expect(files.value).toHaveLength(0)
    expect(revokeSpy).toHaveBeenCalledTimes(2)
  })

  it('respects maxCount and calls onExceed', () => {
    const onExceed = vi.fn()
    const maxCount = ref(2)
    const { files, addFiles } = useUpload({ maxCount, onExceed })
    addFiles([createFile('a.txt'), createFile('b.txt'), createFile('c.txt')])
    expect(files.value).toHaveLength(2)
    expect(onExceed).toHaveBeenCalledWith(3 - 2)
  })

  it('removes old file when multiple is false', () => {
    const multiple = ref(false)
    const { files, addFiles } = useUpload({ multiple })
    addFiles([createFile('a.txt')])
    expect(files.value).toHaveLength(1)
    addFiles([createFile('b.txt')])
    expect(files.value).toHaveLength(1)
    expect(files.value[0].name).toBe('b.txt')
  })

  it('keeps files when multiple is true', () => {
    const multiple = ref(true)
    const { files, addFiles } = useUpload({ multiple })
    addFiles([createFile('a.txt')])
    addFiles([createFile('b.txt')])
    expect(files.value).toHaveLength(2)
  })

  it('validates maxSize and marks file as error', () => {
    const maxSize = ref(500)
    const onSizeExceed = vi.fn()
    const { files, addFiles } = useUpload({ maxSize, onSizeExceed })
    addFiles([createFile('big.txt', 1024)])
    expect(files.value[0].status).toBe('error')
    expect(files.value[0].error).toBe('sizeExceed')
    expect(onSizeExceed).toHaveBeenCalled()
  })

  it('validates accept and marks mismatched file as error', () => {
    const accept = ref('image/*')
    const onTypeError = vi.fn()
    const { files, addFiles } = useUpload({ accept, onTypeError })
    addFiles([createFile('doc.pdf', 1024, 'application/pdf')])
    expect(files.value[0].status).toBe('error')
    expect(files.value[0].error).toBe('typeError')
    expect(onTypeError).toHaveBeenCalled()
  })

  it('validates accept extension patterns', () => {
    const accept = ref('.txt,.md')
    const { files, addFiles } = useUpload({ accept })
    addFiles([
      createFile('readme.md', 512, 'text/markdown'),
      createFile('doc.pdf', 256, 'application/pdf'),
    ])
    const valid = files.value.filter(f => f.status !== 'error')
    const invalid = files.value.filter(f => f.status === 'error')
    expect(valid).toHaveLength(1)
    expect(invalid).toHaveLength(1)
  })

  it('accepts files matching wildcard MIME', () => {
    const accept = ref('image/*')
    const { files, addFiles } = useUpload({ accept })
    addFiles([createFile('photo.png', 512, 'image/png')])
    expect(files.value[0].status).toBe('pending')
  })

  it('handles drag-and-drop state', () => {
    const { dragOver, handleDrag, handleDragLeave, handleDrop, files } = useUpload()

    // simulate dragover
    const dragEvent = new DragEvent('dragover', { cancelable: true, bubbles: true })
    vi.spyOn(dragEvent, 'preventDefault')
    vi.spyOn(dragEvent, 'stopPropagation')
    handleDrag(dragEvent)
    expect(dragEvent.preventDefault).toHaveBeenCalled()
    expect(dragOver.value).toBe(true)

    // simulate dragleave via internal counter logic
    const leaveEvent = new DragEvent('dragleave', { cancelable: true, bubbles: true })
    handleDragLeave(leaveEvent)
    // after one dragleave from one dragover, counter goes to 0
    expect(dragOver.value).toBe(false)

    // simulate drop
    const file = createFile('drop.txt', 512)
    const dt = new DataTransfer()
    dt.items.add(file)
    const dropEvent = new DragEvent('drop', { cancelable: true, bubbles: true })
    Object.defineProperty(dropEvent, 'dataTransfer', { value: dt })
    handleDrop(dropEvent)
    expect(dragOver.value).toBe(false)
    expect(files.value).toHaveLength(1)
    expect(files.value[0].name).toBe('drop.txt')
  })

  it('dispatches file input change event', () => {
    const { files, fileInputRef, handleFileInput } = useUpload()

    // Create a fake input element
    const input = document.createElement('input')
    input.type = 'file'
    fileInputRef.value = input

    const file = createFile('selected.txt', 256)
    const dt = new DataTransfer()
    dt.items.add(file)
    Object.defineProperty(input, 'files', { value: dt.files, configurable: true })

    // Simulate a change event with the input as target
    handleFileInput({ target: input } as unknown as Event)

    expect(files.value).toHaveLength(1)
    expect(files.value[0].name).toBe('selected.txt')
  })

  it('autoUpload triggers upload after file addition', async () => {
    vi.useFakeTimers()
    const autoUpload = ref(true)
    const { files, addFiles } = useUpload({ autoUpload })
    addFiles([createFile('auto.txt', 512)])
    expect(files.value[0].status).toBe('uploading')

    // Advance timers to simulate progress
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(300)
    }
    await vi.runAllTimersAsync()

    expect(files.value[0].status).toBe('done')
    expect(files.value[0].progress).toBeGreaterThanOrEqual(100)
    vi.useRealTimers()
  })

  it('manual upload progresses pending files', async () => {
    vi.useFakeTimers()
    const { files, addFiles, upload } = useUpload()
    addFiles([createFile('manual.txt', 512)])
    // Kick off upload without awaiting — timers are paused
    const uploadPromise = upload()
    // Advance timers to trigger each setInterval tick
    for (let i = 0; i < 20; i++) {
      vi.advanceTimersByTime(300)
    }
    await uploadPromise
    expect(files.value[0].status).toBe('done')
    vi.useRealTimers()
  })

  it('custom uploadFn is invoked instead of simulated progress', async () => {
    const uploadFn = vi.fn().mockResolvedValue(undefined)
    const { addFiles, upload } = useUpload({ uploadFn })
    addFiles([createFile('custom.txt', 512)])
    await upload()

    expect(uploadFn).toHaveBeenCalledTimes(1)
    expect(uploadFn).toHaveBeenCalledWith(expect.objectContaining({ name: 'custom.txt' }))
    // uploadFn is invoked, progress stays 0 (caller controls it)
  })

  it('custom uploadFn error marks file as error', async () => {
    const uploadFn = vi.fn().mockRejectedValue(new Error('Network error'))
    const { files, addFiles, upload } = useUpload({ uploadFn })
    addFiles([createFile('fail.txt', 512)])
    await upload()

    expect(files.value[0].status).toBe('error')
    expect(files.value[0].error).toBe('Network error')
  })
})
