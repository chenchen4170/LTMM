import type { ReactNode } from 'react'
import styles from './Panel.module.css'

interface PanelProps {
  title: string
  children?: ReactNode
}

/** 通用面板：固定标题栏 + 可滚动内容区。 */
export function Panel({ title, children }: PanelProps) {
  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <span className={styles.title} title={title}>
          {title}
        </span>
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  )
}
