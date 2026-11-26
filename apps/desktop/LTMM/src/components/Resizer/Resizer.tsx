import { useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import styles from './Resizer.module.css'

interface ResizerProps {
  /** 被调整面板的当前宽度（px） */
  value: number
  min: number
  /** 拖拽时才计算，因为上限取决于当前窗口宽度和另一侧面板 */
  getMax: () => number
  /** 面板位于分隔条的哪一侧：left 面板向右拖变宽，right 面板向左拖变宽 */
  side: 'left' | 'right'
  onChange: (value: number) => void
  onDragChange?: (dragging: boolean) => void
  label: string
}

const KEY_STEP = 16

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), Math.max(min, max))

/** 垂直分隔条：支持鼠标/触摸拖拽和键盘方向键调整宽度。 */
export function Resizer({
  value,
  min,
  getMax,
  side,
  onChange,
  onDragChange,
  label,
}: ResizerProps) {
  const start = useRef<{ x: number; value: number } | null>(null)
  const [active, setActive] = useState(false)
  const sign = side === 'left' ? 1 : -1

  const setDragging = (dragging: boolean) => {
    setActive(dragging)
    onDragChange?.(dragging)
  }

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, value }
    setDragging(true)
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return
    const delta = (e.clientX - start.current.x) * sign
    onChange(clamp(start.current.value + delta, min, getMax()))
  }

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return
    start.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const dir = e.key === 'ArrowRight' ? 1 : -1
    onChange(clamp(value + dir * sign * KEY_STEP, min, getMax()))
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={min}
      tabIndex={0}
      className={`${styles.resizer} ${active ? styles.active : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
    />
  )
}
