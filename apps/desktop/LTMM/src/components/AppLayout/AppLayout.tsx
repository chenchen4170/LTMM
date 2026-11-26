import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Resizer } from '../Resizer'
import styles from './AppLayout.module.css'

interface AppLayoutProps {
  left: ReactNode
  center: ReactNode
  right: ReactNode
}

const SIDEBAR_MIN = 180
const CENTER_MIN = 320
const RESIZER_WIDTH = 5
const DEFAULT_LEFT = 260
const DEFAULT_RIGHT = 300

/** 左-中-右三栏布局骨架；左右两栏宽度可拖拽调整，中间自适应。 */
export function AppLayout({ left, center, right }: AppLayoutProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [widths, setWidths] = useState({ left: DEFAULT_LEFT, right: DEFAULT_RIGHT })
  const { left: leftWidth, right: rightWidth } = widths
  const setLeftWidth = (left: number) => setWidths((w) => ({ ...w, left }))
  const setRightWidth = (right: number) => setWidths((w) => ({ ...w, right }))
  const [dragging, setDragging] = useState(false)

  // 某一侧栏的宽度上限：容器宽度 - 另一侧栏 - 两个分隔条 - 中间最小宽度
  const maxFor = useCallback(
    (other: number) =>
      (rootRef.current?.clientWidth ?? window.innerWidth) -
      other -
      RESIZER_WIDTH * 2 -
      CENTER_MIN,
    [],
  )

  // 挂载及窗口缩小时：若两侧栏占用过多，按比例收缩，保证中间区域不低于最小宽度
  useLayoutEffect(() => {
    const fit = () => {
      const available =
        (rootRef.current?.clientWidth ?? window.innerWidth) -
        RESIZER_WIDTH * 2 -
        CENTER_MIN
      setWidths(({ left, right }) => {
        if (left + right <= available) return { left, right }
        const ratio = Math.max(available, SIDEBAR_MIN * 2) / (left + right)
        return {
          left: Math.max(SIDEBAR_MIN, Math.floor(left * ratio)),
          right: Math.max(SIDEBAR_MIN, Math.floor(right * ratio)),
        }
      })
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  const style = {
    '--left-width': `${leftWidth}px`,
    '--right-width': `${rightWidth}px`,
    '--resizer-width': `${RESIZER_WIDTH}px`,
  } as CSSProperties

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${dragging ? styles.dragging : ''}`}
      style={style}
    >
      <aside className={styles.left} aria-label="文件列表">
        {left}
      </aside>
      <Resizer
        side="left"
        label="调整文件列表宽度"
        value={leftWidth}
        min={SIDEBAR_MIN}
        getMax={() => maxFor(rightWidth)}
        onChange={setLeftWidth}
        onDragChange={setDragging}
      />
      <main className={styles.center}>{center}</main>
      <Resizer
        side="right"
        label="调整统计汇总宽度"
        value={rightWidth}
        min={SIDEBAR_MIN}
        getMax={() => maxFor(leftWidth)}
        onChange={setRightWidth}
        onDragChange={setDragging}
      />
      <aside className={styles.right} aria-label="统计与时间线">
        {right}
      </aside>
    </div>
  )
}
