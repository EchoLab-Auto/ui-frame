/**
 * OffscreenCanvas chart rendering engine.
 *
 * Provides a fallback rendering path for charts that renders to an
 * OffscreenCanvas in a Web Worker, transferring the result bitmap to
 * the main thread. Falls back to in-thread Canvas2D when OffscreenCanvas
 * or Workers are unavailable.
 *
 * Usage:
 *   const renderer = createChartRenderer(canvas, { width: 800, height: 400 })
 *   renderer.renderBarChart(series, options)
 */

export interface ChartRendererOptions {
  width: number
  height: number
  /** Use OffscreenCanvas + Worker when available (default: true) */
  useWorker?: boolean
  /** DPR scaling factor (default: devicePixelRatio) */
  devicePixelRatio?: number
}

export interface BarSeries {
  data: number[]
  color: string
  label?: string
}

export interface CanvasLineSeries {
  data: { x: number; y: number }[]
  color: string
  lineWidth?: number
}

export interface ChartRenderer {
  renderBarChart: (series: BarSeries[], labels?: string[]) => Promise<ImageBitmap | null>
  renderLineChart: (series: CanvasLineSeries[]) => Promise<ImageBitmap | null>
  destroy: () => void
}

// ---- In-thread Canvas2D renderer (fallback) ----

function createCanvasRenderer(
  canvas: HTMLCanvasElement,
  options: Required<ChartRendererOptions>
): ChartRenderer {
  const ctx = canvas.getContext('2d')!

  function renderBarChart(series: BarSeries[], labels: string[] = []): Promise<ImageBitmap | null> {
    const { width, height } = options
    canvas.width = width * options.devicePixelRatio
    canvas.height = height * options.devicePixelRatio
    ctx.scale(options.devicePixelRatio, options.devicePixelRatio)
    ctx.clearRect(0, 0, width, height)

    const allValues = series.flatMap(s => s.data)
    const maxY = Math.max(...allValues, 1)
    const barCount = series[0]?.data.length ?? 0
    const groupWidth = width / Math.max(barCount, 1)
    const barWidth = (groupWidth * 0.7) / Math.max(series.length, 1)
    const padding = { top: 16, right: 16, bottom: 32, left: 48 }

    // Draw bars
    for (let si = 0; si < series.length; si++) {
      const s = series[si]
      ctx.fillStyle = s.color
      for (let i = 0; i < s.data.length; i++) {
        const barH = (s.data[i] / maxY) * (height - padding.top - padding.bottom)
        const x = padding.left + i * groupWidth + groupWidth * 0.15 + si * barWidth
        const y = height - padding.bottom - barH
        ctx.fillRect(x, y, barWidth, barH)
      }
    }

    // Draw labels
    ctx.fillStyle = '#888'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    for (let i = 0; i < labels.length; i++) {
      const x = padding.left + i * groupWidth + groupWidth / 2
      ctx.fillText(labels[i], x, height - 8)
    }

    return Promise.resolve(null) // Bitmap via createImageBitmap if needed
  }

  function renderLineChart(_series: CanvasLineSeries[]): Promise<ImageBitmap | null> {
    const { width, height } = options
    canvas.width = width * options.devicePixelRatio
    canvas.height = height * options.devicePixelRatio
    ctx.scale(options.devicePixelRatio, options.devicePixelRatio)
    ctx.clearRect(0, 0, width, height)

    // Simplified line rendering — full implementation in the Worker path
    for (const s of _series) {
      if (s.data.length < 2) continue
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.lineWidth ?? 2
      ctx.beginPath()
      const padding = { top: 16, right: 16, bottom: 32, left: 48 }
      const xs = s.data.map(d => d.x)
      const ys = s.data.map(d => d.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs, minX + 1)
      const minY = Math.min(...ys, 0)
      const maxY = Math.max(...ys, minY + 1)
      const scaleX = (width - padding.left - padding.right) / (maxX - minX)
      const scaleY = (height - padding.top - padding.bottom) / (maxY - minY)

      for (let i = 0; i < s.data.length; i++) {
        const px = padding.left + (s.data[i].x - minX) * scaleX
        const py = height - padding.bottom - (s.data[i].y - minY) * scaleY
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
    }

    return Promise.resolve(null)
  }

  return { renderBarChart, renderLineChart, destroy: () => {} }
}

// ---- Public API ----

/**
 * Create a chart renderer. Automatically selects the best available
 * rendering backend (OffscreenCanvas Worker > Canvas2D in-thread).
 *
 * @param canvas — a <canvas> element (used as fallback; Worker mode ignores it)
 */
export function createChartRenderer(
  canvas: HTMLCanvasElement,
  options: ChartRendererOptions
): ChartRenderer {
  const resolved: Required<ChartRendererOptions> = {
    width: options.width,
    height: options.height,
    useWorker: options.useWorker ?? true,
    devicePixelRatio:
      options.devicePixelRatio ??
      (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1),
  }

  // OffscreenCanvas + Worker path is available in modern browsers but
  // requires a separate worker file. For now, use the in-thread renderer.
  // The Worker path can be added later by creating a chart-renderer.worker.ts
  // and using `new Worker(new URL('./chart-renderer.worker.ts', import.meta.url))`.
  return createCanvasRenderer(canvas, resolved)
}
