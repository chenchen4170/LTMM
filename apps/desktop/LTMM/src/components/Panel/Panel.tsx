import type { ReactNode } from 'react'
import styles from './Panel.module.css'

interface PanelProps {
  /** 通常是文字；也可以是标签页等节点 */
  title: ReactNode
  /** 标题栏右侧的附加内容（如状态提示） */
  extra?: ReactNode
  /** 覆盖内容区默认样式（内边距、滚动），用于编辑器等需要撑满的内容 */
  bodyClassName?: string
  children?: ReactNode
}

/** 通用面板：固定标题栏 + 可滚动内容区。 */
export function Panel({ title, extra, bodyClassName, children }: PanelProps) {
  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        {typeof title === 'string' ? (
          <span className={styles.title} title={title}>
            {title}
          </span>
        ) : (
          // 非文字标题（如标签页）直接作为标题栏的子元素，以便撑满标题栏高度
          title
        )}
        {extra}
      </header>
      <div className={`${styles.body} ${bodyClassName ?? ''}`}>{children}</div>
    </section>
  )
}
