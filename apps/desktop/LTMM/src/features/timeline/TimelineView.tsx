import { useEffect, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import { categoryHue } from '../../lib/categoryColor'
import { buildTimelineItems, layoutTimeline } from '../../lib/timeline'
import { formatMinuteOfDay } from '../../lib/timeLog'
import styles from './TimelineView.module.css'

/** 时间轴上每小时的高度（px） */
const HOUR_PX = 56
/** 块高度不低于此值时，才有空间显示第二行（时间） */
const TWO_LINE_MIN_PX = 38
const HOURS = Array.from({ length: 24 }, (_, h) => h)

interface TimelineViewProps {
  fileName: string | null
  /** 选中文件的文本（含未保存的编辑）；未选中、加载中或读取失败时为 null */
  content: string | null
  unreadable: boolean
}

/** 当日时间线：把当天的记录按时间画在 24 小时的时间轴上，类似日历的"日程"视图。 */
export function TimelineView({ fileName, content, unreadable }: TimelineViewProps) {
  const items = useMemo(
    () => (content === null ? null : layoutTimeline(buildTimelineItems(content))),
    [content],
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrolledFor = useRef<string | null>(null)

  // 打开文件后滚动到第一条记录附近（只在切换文件时滚动一次，避免编辑时跳动）
  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      scrolledFor.current = null // 时间轴未显示（无记录等），下次出现时需要重新滚动
      return
    }
    if (!items || items.length === 0 || scrolledFor.current === fileName) return
    scrolledFor.current = fileName
    el.scrollTop = Math.max(0, (items[0].start / 60) * HOUR_PX - HOUR_PX)
  }, [fileName, items])

  const message = (text: string) => (
    <div className={styles.message}>
      <p className="placeholder">{text}</p>
    </div>
  )

  if (!fileName) return message('选择左侧文件以查看时间线')
  if (unreadable) return message('该文件无法读取，无法显示时间线')
  if (!items) return null
  if (items.length === 0) {
    return message('没有符合格式的记录\n格式：- [ ] 15:38 - 16:08 分类 描述')
  }

  return (
    <div className={styles.scroll} ref={scrollRef}>
      <div className={styles.grid} style={{ height: 24 * HOUR_PX }}>
        {HOURS.map((h) => (
          <div key={h} className={styles.hour} style={{ top: h * HOUR_PX }}>
            <span className={styles.hourLabel}>{formatMinuteOfDay(h * 60)}</span>
          </div>
        ))}

        <div className={styles.events}>
          {items.map((item, index) => {
            const height = ((item.end - item.start) / 60) * HOUR_PX
            const showTimeLine = height >= TWO_LINE_MIN_PX
            const timeText = `${formatMinuteOfDay(item.start)}–${
              item.rawEnd === null ? '进行中' : formatMinuteOfDay(item.rawEnd)
            }`
            return (
              <div
                key={index}
                className={`${styles.block} ${item.inProgress ? styles.inProgress : ''}`}
                style={
                  {
                    '--hue': categoryHue(item.category),
                    top: (item.start / 60) * HOUR_PX,
                    height: height - 2,
                    left: `calc(${(item.column / item.columns) * 100}% + 1px)`,
                    width: `calc(${100 / item.columns}% - 2px)`,
                  } as CSSProperties
                }
                title={`${timeText}  ${item.category}${item.description ? ' ' + item.description : ''}`}
              >
                <div className={styles.line}>
                  <span className={styles.category}>{item.category}</span>
                  {item.description && ` ${item.description}`}
                  {/* 矮块放不下第二行（时间）时，在第一行标出"进行中" */}
                  {item.inProgress && !showTimeLine && <span className={styles.time}> · 进行中</span>}
                </div>
                {showTimeLine && (
                  <div className={`${styles.line} ${styles.time}`}>{timeText}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
