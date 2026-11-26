import { useEffect, useRef, useState } from 'react'
import styles from './AddEntryButton.module.css'

interface AddEntryButtonProps {
  categories: string[]
  onSelect: (category: string) => void
}

/** 浮动的 + 按钮：点击展开分类列表，选择分类后触发 onSelect 并收起。 */
export function AddEntryButton({ categories, onSelect }: AddEntryButtonProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // 展开时：点击外部或按 Esc 收起
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className={styles.root} ref={rootRef}>
      {open && (
        <ul className={styles.menu} role="menu" aria-label="选择分类">
          {categories.length === 0 ? (
            <li className={styles.empty}>
              还没有分类
              <br />
              请在菜单 Settings… 中添加
            </li>
          ) : (
            categories.map((name) => (
              <li key={name} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className={styles.item}
                  title={name}
                  onClick={() => {
                    setOpen(false)
                    onSelect(name)
                  }}
                >
                  {name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      <button
        type="button"
        className={`${styles.fab} ${open ? styles.open : ''}`}
        aria-label="添加记录"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        +
      </button>
    </div>
  )
}
