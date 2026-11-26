import { Panel } from '../../components/Panel'
import { useFileContent } from './useFileContent'
import styles from './FileViewerPanel.module.css'

interface FileViewerPanelProps {
  dir: string | null
  fileName: string | null
}

const FAILURE_MESSAGES = {
  'too-large': '文件过大（超过 1 MB），暂不支持预览',
  binary: '这是二进制文件，无法以文本形式预览',
  'not-a-file': '该项不是普通文件',
  error: '无法读取该文件',
} as const

export function FileViewerPanel({ dir, fileName }: FileViewerPanelProps) {
  const { outcome, loading } = useFileContent(dir, fileName)

  return (
    <Panel title={fileName ?? '文件内容'}>
      {!fileName ? (
        <p className="placeholder">选择左侧文件以查看内容</p>
      ) : loading || !outcome ? null : outcome.ok ? (
        outcome.content === '' ? (
          <p className="placeholder">文件内容为空</p>
        ) : (
          <pre className={styles.content}>{outcome.content}</pre>
        )
      ) : (
        <p className="placeholder">{FAILURE_MESSAGES[outcome.reason]}</p>
      )}
    </Panel>
  )
}
