import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { Panel } from '../../components/Panel'
import { appendDoingEntry } from '../../lib/timeLog'
import { AddEntryButton } from './AddEntryButton'
import type { FileOutcome, SaveState } from './useEditableFile'
import styles from './FileViewerPanel.module.css'

interface FileViewerPanelProps {
  fileName: string | null
  /** 文件读取结果；加载中为 null */
  outcome: FileOutcome | null
  /** 编辑器中的文本 */
  text: string
  saveState: SaveState
  /** 可选的分类（来自设置），点击右下角 + 时供选择 */
  categories: string[]
  onChange: (text: string) => void
  /** 立即保存（Cmd/Ctrl+S） */
  onSave: () => void
}

const FAILURE_MESSAGES = {
  'too-large': '文件过大（超过 1 MB），暂不支持预览',
  binary: '这是二进制文件，无法以文本形式预览',
  'not-a-file': '该项不是普通文件',
  error: '无法读取该文件',
} as const

const SAVE_LABELS: Record<SaveState, string> = {
  saved: '已保存',
  unsaved: '未保存',
  saving: '保存中…',
  error: '保存失败，将自动重试',
}

export function FileViewerPanel({
  fileName,
  outcome,
  text,
  saveState,
  categories,
  onChange,
  onSave,
}: FileViewerPanelProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      onSave()
    }
  }

  const editing = fileName !== null && outcome?.ok === true
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // 追加记录后要选中的范围，等文本更新渲染完成后再应用
  const pendingSelection = useRef<[number, number] | null>(null)

  const handleAddEntry = (category: string) => {
    const entry = appendDoingEntry(text, category, new Date())
    pendingSelection.current = [entry.selectStart, entry.selectEnd]
    onChange(entry.text)
  }

  // 新增记录后：聚焦文本框、滚动到末尾，并选中 doing，方便直接输入结束时间
  useEffect(() => {
    const range = pendingSelection.current
    const el = textareaRef.current
    if (!range || !el) return
    pendingSelection.current = null
    el.focus()
    el.setSelectionRange(range[0], range[1])
    el.scrollTop = el.scrollHeight
  }, [text])

  return (
    <div className={styles.root}>
      <Panel
        title={fileName ?? '文件内容'}
        bodyClassName={editing ? styles.editorBody : undefined}
        extra={
          editing && (
            <span
              className={`${styles.status} ${saveState === 'error' ? styles.statusError : ''}`}
              role="status"
            >
              {SAVE_LABELS[saveState]}
            </span>
          )
        }
      >
        {!fileName ? (
          <p className="placeholder">选择左侧文件以查看内容</p>
        ) : !outcome ? null : outcome.ok ? (
          <textarea
            ref={textareaRef}
            className={styles.editor}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            aria-label={`编辑 ${fileName}`}
          />
        ) : (
          <p className="placeholder">{FAILURE_MESSAGES[outcome.reason]}</p>
        )}
      </Panel>
      {editing && <AddEntryButton categories={categories} onSelect={handleAddEntry} />}
    </div>
  )
}
