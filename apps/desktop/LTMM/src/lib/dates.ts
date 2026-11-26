/** 统计维度：日 / 周 / 月 */
export type Period = 'day' | 'week' | 'month'

/**
 * 日期统一用"天序号"（自 1970-01-01 起的整数天）做计算，用 UTC 避开夏令时问题；
 * 需要展示或在文件名中查找时用 ISO 字符串 "YYYY-MM-DD"。
 */
const MS_PER_DAY = 86_400_000

/** 闭区间 [start, end]，均为天序号 */
export interface DayRange {
  start: number
  end: number
}

// 文件名中的日期：2026-11-26 / 2026.11.26 / 2026_11_26（月、日可为一位数），或 20261126
const DATE_WITH_SEPARATOR = /(?<!\d)(\d{4})([-._])(\d{1,2})\2(\d{1,2})(?!\d)/
const DATE_COMPACT = /(?<!\d)(\d{4})(\d{2})(\d{2})(?!\d)/

const toDayNumber = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d) / MS_PER_DAY

/** 从文件名中解析日期，返回天序号；找不到或日期不存在（如 2026-02-30）时返回 null。 */
export function parseDateFromFileName(name: string): number | null {
  const sep = DATE_WITH_SEPARATOR.exec(name)
  const compact = sep ? null : DATE_COMPACT.exec(name)
  const parts = sep ? [sep[1], sep[3], sep[4]] : compact ? [compact[1], compact[2], compact[3]] : null
  if (!parts) return null

  const [y, m, d] = parts.map(Number)
  if (y < 1900 || y > 2200) return null
  const dayNumber = toDayNumber(y, m, d)
  // 往返校验：2026-02-30 会被 Date 滚动成 3 月，此时视为无效
  const date = new Date(dayNumber * MS_PER_DAY)
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null
  }
  return dayNumber
}

export const dayNumberToIso = (n: number) => new Date(n * MS_PER_DAY).toISOString().slice(0, 10)

/** 本地时区的"今天"（天序号） */
export const todayDayNumber = (now: Date = new Date()) =>
  toDayNumber(now.getFullYear(), now.getMonth() + 1, now.getDate())

/** 包含 selectedDay 的周期范围：日=当天；周=周一至周日；月=当月 1 日至月底。 */
export function getPeriodRange(period: Period, selectedDay: number): DayRange {
  if (period === 'day') return { start: selectedDay, end: selectedDay }
  if (period === 'week') {
    // 1970-01-01 是周四，(n + 3) % 7 即从周一起算的星期序号（周一=0）
    const weekday = (((selectedDay + 3) % 7) + 7) % 7
    const start = selectedDay - weekday
    return { start, end: start + 6 }
  }
  const date = new Date(selectedDay * MS_PER_DAY)
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  return { start: Date.UTC(y, m, 1) / MS_PER_DAY, end: Date.UTC(y, m + 1, 0) / MS_PER_DAY }
}

/**
 * 统计时计入多少天（用来算"未记录"时长和占比）：
 * 周期内尚未到来的日子不算作"未记录"，所以截止到今天（或所选日期，取较晚者）。
 */
export function countedDays(range: DayRange, selectedDay: number, today: number): number {
  const effectiveEnd = Math.min(range.end, Math.max(today, selectedDay))
  return Math.max(1, effectiveEnd - range.start + 1)
}

/** 周期的展示文案：周 "2026-11-23 ~ 2026-11-29"，月 "2026年11月"，日为 ISO 日期 */
export function formatRange(period: Period, range: DayRange): string {
  if (period === 'day') return dayNumberToIso(range.start)
  if (period === 'week') return `${dayNumberToIso(range.start)} ~ ${dayNumberToIso(range.end)}`
  const [y, m] = dayNumberToIso(range.start).split('-')
  return `${y}年${Number(m)}月`
}
