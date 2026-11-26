/** 一天的分钟数，用于计算"未记录"时长和占比 */
export const MINUTES_PER_DAY = 24 * 60

export const UNRECORDED_LABEL = '未记录'

export interface TimeEntry {
  /** 开始时间，自 00:00 起的分钟数 */
  start: number
  /** 结束时间，自 00:00 起的分钟数（跨午夜时大于 1440） */
  end: number
  category: string
  description: string
}

export interface StatRow {
  category: string
  minutes: number
  /** 占一天（24 小时）的比例，0~1 */
  ratio: number
  /** 是否为"未记录"行 */
  unrecorded: boolean
}

export interface DayStats {
  rows: StatRow[]
  recordedMinutes: number
}

// 格式："- [ ] 15:38 - 16:08 管理 描述"
// 依次为：markdown 待办标记、开始 - 结束时间、分类（不含空格）、可选描述
const LINE =
  /^\s*[-*+]\s+\[[ xX]\]\s+(\d{1,2}):(\d{2})\s*[-–—~]\s*(\d{1,2}):(\d{2})\s+(\S+)(?:\s+(.*?))?\s*$/

const toMinutes = (h: string, m: string) => Number(h) * 60 + Number(m)

/** 解析记录文本，不符合格式的行（标题、空行、备注等）会被忽略。 */
export function parseTimeLog(text: string): TimeEntry[] {
  const entries: TimeEntry[] = []
  for (const line of text.split(/\r?\n/)) {
    const match = LINE.exec(line)
    if (!match) continue
    const [, sh, sm, eh, em, category, description = ''] = match
    if (Number(sh) > 24 || Number(eh) > 24 || Number(sm) > 59 || Number(em) > 59) continue

    const start = toMinutes(sh, sm)
    let end = toMinutes(eh, em)
    if (end < start) end += MINUTES_PER_DAY // 结束时间早于开始时间：视为跨午夜
    entries.push({ start, end, category, description })
  }
  return entries
}

/**
 * 按分类汇总时长，按时长降序排列（时长相同保持出现顺序），
 * 最后追加"未记录"行（一天 24 小时减去已记录时长，为 0 时不显示）。
 */
export function computeDayStats(entries: TimeEntry[]): DayStats {
  const byCategory = new Map<string, number>()
  for (const { start, end, category } of entries) {
    const minutes = end - start
    if (minutes > 0) byCategory.set(category, (byCategory.get(category) ?? 0) + minutes)
  }

  const recordedMinutes = [...byCategory.values()].reduce((a, b) => a + b, 0)
  // 记录总时长超过 24 小时（时间重叠等）时，以记录总时长为分母，保证占比不超过 100%
  const denominator = Math.max(MINUTES_PER_DAY, recordedMinutes)

  const rows: StatRow[] = [...byCategory]
    .sort((a, b) => b[1] - a[1])
    .map(([category, minutes]) => ({
      category,
      minutes,
      ratio: minutes / denominator,
      unrecorded: false,
    }))

  const unrecordedMinutes = MINUTES_PER_DAY - recordedMinutes
  if (unrecordedMinutes > 0) {
    rows.push({
      category: UNRECORDED_LABEL,
      minutes: unrecordedMinutes,
      ratio: unrecordedMinutes / denominator,
      unrecorded: true,
    })
  }

  return { rows, recordedMinutes }
}

/** 90 → "1小时30分"，45 → "45分钟"，120 → "2小时" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}分钟`
  return m === 0 ? `${h}小时` : `${h}小时${m}分`
}

export const formatPercent = (ratio: number) => `${(ratio * 100).toFixed(1)}%`

/** 进行中的记录用它代替结束时间，等用户补全真实的结束时间后才会计入统计 */
export const DOING_PLACEHOLDER = 'doing'

const pad2 = (n: number) => String(n).padStart(2, '0')

/** 24 小时制 HH:mm */
export const formatClock = (date: Date) => `${pad2(date.getHours())}:${pad2(date.getMinutes())}`

/** 新记录行："- [ ] 15:38 - doing 管理"（结束时间尚未确定，不符合统计格式，因此暂不计入统计） */
export function buildDoingLine(category: string, now: Date): string {
  return `- [ ] ${formatClock(now)} - ${DOING_PLACEHOLDER} ${category}`
}

/**
 * 在文本末尾追加一条"进行中"的记录，保证它独占一行，并以换行结尾。
 * 同时返回占位符 doing 所在的范围，便于界面选中它让用户直接输入结束时间。
 */
export function appendDoingEntry(text: string, category: string, now: Date) {
  const line = buildDoingLine(category, now)
  const separator = text === '' || text.endsWith('\n') ? '' : '\n'
  const lineStart = text.length + separator.length
  const selectStart = lineStart + line.indexOf(DOING_PLACEHOLDER)
  return {
    text: `${text}${separator}${line}\n`,
    selectStart,
    selectEnd: selectStart + DOING_PLACEHOLDER.length,
  }
}
