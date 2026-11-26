import { useMemo } from 'react'
import { Panel } from '../../components/Panel'
import {
  computeDayStats,
  formatDuration,
  formatPercent,
  parseTimeLog,
} from './timeLog'
import styles from './StatsPanel.module.css'

interface StatsPanelProps {
  /** 当前选中的文件（即"当日"记录） */
  fileName: string | null
  /** 文件文本内容；未选中、加载中或读取失败时为 null */
  content: string | null
  /** 文件已选中但无法读取（二进制、过大等） */
  unreadable: boolean
}

/** 右侧：当日各分类的时长、占比统计。 */
export function StatsPanel({ fileName, content, unreadable }: StatsPanelProps) {
  const stats = useMemo(
    () => (content === null ? null : computeDayStats(parseTimeLog(content))),
    [content],
  )

  return (
    <Panel title="当日统计">
      {!fileName ? (
        <p className="placeholder">选择左侧文件以查看当日统计</p>
      ) : unreadable ? (
        <p className="placeholder">该文件无法读取，无法统计</p>
      ) : !stats ? null : stats.recordedMinutes === 0 ? (
        <p className="placeholder">
          未找到符合格式的记录
          <br />
          格式：- [ ] 15:38 - 16:08 分类 描述
        </p>
      ) : (
        <>
          <p className={styles.file} title={fileName}>
            {fileName} · 已记录 {formatDuration(stats.recordedMinutes)}
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
                <tr key={`${row.unrecorded}:${row.category}`} className={row.unrecorded ? styles.unrecorded : undefined}>
                  <td className={styles.category} title={row.category}>
                    {row.category}
                  </td>
                  <td className={styles.duration}>{formatDuration(row.minutes)}</td>
                  <td className={styles.ratio}>{formatPercent(row.ratio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Panel>
  )
}
