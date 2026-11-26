import { Panel } from '../../components/Panel'
import styles from './FileListPanel.module.css'

interface FileListPanelProps {
  dir: string | null
  files: string[]
  error: boolean
  loading: boolean
  selectedFile: string | null
  onSelect: (name: string) => void
}

/** 路径的最后一段，作为文件夹显示名 */
const baseName = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path

export function FileListPanel({
  dir,
  files,
  error,
  loading,
  selectedFile,
  onSelect,
}: FileListPanelProps) {
  return (
    <Panel title="文件列表">
      {!dir ? (
        <p className="placeholder">未设置工作文件夹，请在菜单 Settings… 中选择</p>
      ) : (
        <>
          <p className={styles.dir} title={dir}>
            {baseName(dir)}
          </p>
          {loading ? null : error ? (
            <p className="placeholder">无法读取该文件夹，请检查路径或权限</p>
          ) : files.length === 0 ? (
            <p className="placeholder">文件夹中没有文件</p>
          ) : (
            <ul className={styles.list}>
              {files.map((name) => {
                const selected = name === selectedFile
                return (
                  <li key={name}>
                    <button
                      type="button"
                      className={`${styles.item} ${selected ? styles.selected : ''}`}
                      aria-current={selected ? 'true' : undefined}
                      title={name}
                      onClick={() => onSelect(name)}
                    >
                      {name}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </Panel>
  )
}
