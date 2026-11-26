import type { KeyboardEvent } from 'react'
import styles from './Tabs.module.css'

interface TabsProps<T extends string> {
  value: T
  onChange: (value: T) => void
  tabs: { value: T; label: string }[]
  /** underline：下划线标签（用于标题栏）；segmented：分段控件（用于内容内切换） */
  variant?: 'underline' | 'segmented'
  label: string
}

/** 标签页 / 分段切换。支持 ←/→ 键在标签间切换。 */
export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
  variant = 'underline',
  label,
}: TabsProps<T>) {
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    onChange(tabs[next].value)
    ;(e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus()
  }

  return (
    <div role="tablist" aria-label={label} className={`${styles.list} ${styles[variant]}`}>
      {tabs.map((tab, index) => {
        const selected = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={`${styles.tab} ${selected ? styles.selected : ''}`}
            onClick={() => onChange(tab.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
