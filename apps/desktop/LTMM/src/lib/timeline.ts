import { MINUTES_PER_DAY, parseInProgressEntries, parseTimeLog } from './timeLog'

/** 过短的记录在时间线上至少占这么多分钟的高度，保证文字可读、可点选 */
export const MIN_VISIBLE_MINUTES = 20
/** "进行中"的记录没有结束时间，用这个时长画一个占位块 */
export const IN_PROGRESS_MINUTES = 30

export interface TimelineItem {
  /** 开始、结束时间：自 00:00 起的分钟数；结束时间已按最小高度和 24:00 处理，仅用于绘制 */
  start: number
  end: number
  category: string
  description: string
  /** 进行中（结束时间为 doing）的记录 */
  inProgress: boolean
  /** 原始的结束时间，进行中为 null；用于展示文字 */
  rawEnd: number | null
}

export interface PositionedItem extends TimelineItem {
  /** 重叠记录并排显示：第几列、共几列 */
  column: number
  columns: number
}

/** 把文本中的记录转为时间线条目（只含当天内的部分，跨午夜的记录截断到 24:00）。 */
export function buildTimelineItems(text: string): TimelineItem[] {
  const items: TimelineItem[] = []

  for (const entry of parseTimeLog(text)) {
    if (entry.start >= MINUTES_PER_DAY) continue
    const end = Math.min(Math.max(entry.end, entry.start + MIN_VISIBLE_MINUTES), MINUTES_PER_DAY)
    items.push({
      start: entry.start,
      end,
      category: entry.category,
      description: entry.description,
      inProgress: false,
      rawEnd: entry.end,
    })
  }

  for (const entry of parseInProgressEntries(text)) {
    if (entry.start >= MINUTES_PER_DAY) continue
    items.push({
      start: entry.start,
      end: Math.min(entry.start + IN_PROGRESS_MINUTES, MINUTES_PER_DAY),
      category: entry.category,
      description: entry.description,
      inProgress: true,
      rawEnd: null,
    })
  }

  return items.sort((a, b) => a.start - b.start || a.end - b.end)
}

/**
 * 给时间上重叠的条目分配并排的列（和日历软件相同的做法）：
 * 把互相连通的重叠条目分为一组，组内每个条目放进第一个不冲突的列，
 * 组内所有条目的宽度均为 1/列数。
 */
export function layoutTimeline(items: TimelineItem[]): PositionedItem[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end)
  const result: PositionedItem[] = []

  let group: PositionedItem[] = []
  let columnEnds: number[] = [] // 每一列当前占用到几点
  let groupEnd = -Infinity

  const closeGroup = () => {
    for (const item of group) item.columns = columnEnds.length
    result.push(...group)
    group = []
    columnEnds = []
  }

  for (const item of sorted) {
    if (item.start >= groupEnd) closeGroup()
    let column = columnEnds.findIndex((end) => end <= item.start)
    if (column === -1) column = columnEnds.length
    columnEnds[column] = item.end
    group.push({ ...item, column, columns: 1 })
    groupEnd = Math.max(groupEnd, item.end)
  }
  closeGroup()

  return result
}
