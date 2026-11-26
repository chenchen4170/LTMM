import { useState } from 'react'
import { Panel } from '../../components/Panel'
import { Tabs } from '../../components/Tabs'
import type { Period } from '../../lib/dates'
import { StatsView } from '../stats'
import { TimelineView } from '../timeline'
import styles from './InsightsPanel.module.css'

type TabKey = 'stats' | 'timeline'

const TABS: { value: TabKey; label: string }[] = [
  { value: 'stats', label: '统计' },
  { value: 'timeline', label: '时间线' },
]

const PERIODS: { value: Period; label: string }[] = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
]

interface InsightsPanelProps {
  dir: string | null
  files: string[]
  /** 当前选中的文件（即"当日"记录） */
  fileName: string | null
  /** 文件文本内容（含未保存的编辑）；未选中、加载中或读取失败时为 null */
  content: string | null
  /** 文件已选中但无法读取（二进制、过大等） */
  unreadable: boolean
}

/** 右侧面板：「统计」（日/周/月）与「时间线」两个标签页。 */
export function InsightsPanel({ dir, files, fileName, content, unreadable }: InsightsPanelProps) {
  // 标签与统计维度放在这里，切换标签再回来时保持选择
  const [tab, setTab] = useState<TabKey>('stats')
  const [period, setPeriod] = useState<Period>('day')

  return (
    <Panel
      title={<Tabs label="右侧面板" value={tab} onChange={setTab} tabs={TABS} />}
      bodyClassName={tab === 'timeline' ? styles.flush : undefined}
    >
      {tab === 'stats' ? (
        <>
          <Tabs
            variant="segmented"
            label="统计维度"
            value={period}
            onChange={setPeriod}
            tabs={PERIODS}
          />
          <StatsView
            period={period}
            dir={dir}
            files={files}
            fileName={fileName}
            content={content}
            unreadable={unreadable}
          />
        </>
      ) : (
        <TimelineView fileName={fileName} content={content} unreadable={unreadable} />
      )}
    </Panel>
  )
}
