import type { CSSProperties } from 'react'
import { categoryHue } from '../../lib/categoryColor'
import {
  countedDays,
  formatRange,
  getPeriodRange,
  parseDateFromFileName,
  todayDayNumber,
} from '../../lib/dates'
import type { Period } from '../../lib/dates'
import { computeStats, formatDuration, formatPercent, parseTimeLog } from '../../lib/timeLog'
import { useFileTexts } from './useFileTexts'
import styles from './StatsView.module.css'

interface StatsViewProps {
  period: Period
  dir: string | null
  /** 工作文件夹中的所有文件名（周/月统计需要从中找出同一周期的其他日期的文件） */
  files: string[]
  /** 当前选中的文件，它的日期决定统计的是哪一天/哪一周/哪一月 */
  fileName: string | null
  /** 选中文件的文本（含未保存的编辑）；未选中、加载中或读取失败时为 null */
  content: string | null
  /** 文件已选中但无法读取（二进制、过大等） */
  unreadable: boolean
}

const PERIOD_NAMES = { day: '当日', week: '本周', month: '本月' } as const

function computeStatsFor(
  period: Period,
  content: string | null,
  otherTexts: Record<string, string> | null,
  days: number,
) {
  if (content === null) return null
  if (period === 'day') return computeStats(parseTimeLog(content), 1)
  if (otherTexts === null) return null // 其他文件还在加载
  return computeStats([content, ...Object.values(otherTexts)].flatMap(parseTimeLog), days)
}

/** 各分类的时长、占比统计（日 / 周 / 月）。 */
export function StatsView({ period, dir, files, fileName, content, unreadable }: StatsViewProps) {
  // 选中文件名里的日期；周/月统计据此确定周期，并汇总该周期内其他日期的文件
  const selectedDay = fileName ? parseDateFromFileName(fileName) : null
  const range =
    period !== 'day' && selectedDay !== null ? getPeriodRange(period, selectedDay) : null

  // 同一周期内、其他日期的文件（选中的文件用编辑中的文本，不从磁盘读）
  const otherFiles = range
    ? files.filter((name) => {
        if (name === fileName) return false
        const day = parseDateFromFileName(name)
        return day !== null && day >= range.start && day <= range.end
      })
    : []
  const otherTexts = useFileTexts(dir, otherFiles)

  const days =
    range && selectedDay !== null ? countedDays(range, selectedDay, todayDayNumber()) : 1

  // 解析和汇总的开销很小（最多一个月的记录），每次渲染直接计算，编辑时统计实时更新
  const stats = computeStatsFor(period, content, otherTexts, days)

  if (!fileName) return <p className="placeholder">选择左侧文件以查看统计</p>
  if (unreadable) return <p className="placeholder">该文件无法读取，无法统计</p>
  if (period !== 'day' && !range) {
    return (
      <p className="placeholder">
        无法从文件名中识别日期，不能按{period === 'week' ? '周' : '月'}统计
        <br />
        文件名需包含日期，如 2026-11-26
      </p>
    )
  }
  if (!stats) return null
  if (stats.recordedMinutes === 0) {
    return (
      <p className="placeholder">
        {PERIOD_NAMES[period]}没有符合格式的记录
        <br />
        格式：- [ ] 15:38 - 16:08 分类 描述
      </p>
    )
  }

  const summary =
    period === 'day'
      ? fileName
      : `${formatRange(period, range!)} · 统计 ${days} 天`

  return (
    <>
      <p className={styles.file} title={summary}>
        {summary} · 已记录 {formatDuration(stats.recordedMinutes)}
      </p>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>分类</th>
            <th className={styles.duration}>时长</th>
            <th className={styles.ratio}>占比</th>
          </tr>
        </thead>
        <tbody>
          {stats.rows.map((row) => (
            <tr
              key={`${row.unrecorded}:${row.category}`}
              className={row.unrecorded ? styles.unrecorded : undefined}
            >
              <td title={row.category}>
                <div className={styles.category}>
                  <span
                    className={styles.dot}
                    style={
                      row.unrecorded
                        ? undefined
                        : ({ '--hue': categoryHue(row.category) } as CSSProperties)
                    }
                  />
                  <span className={styles.categoryName}>{row.category}</span>
                </div>
              </td>
              <td className={styles.duration}>{formatDuration(row.minutes)}</td>
              <td className={styles.ratio}>{formatPercent(row.ratio)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
