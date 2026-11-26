import { useSettings } from './useSettings'
import styles from './SettingsPage.module.css'

/** 设置窗口内容。 */
export function SettingsPage() {
  const { settings, update } = useSettings()
  const api = window.electronAPI

  const chooseFolder = async () => {
    const dir = await api?.selectFolder()
    if (dir) await update({ workspaceDir: dir })
  }

  const dir = settings?.workspaceDir ?? null

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>设置</h1>

      <div className={styles.field}>
        <span className={styles.label}>工作文件夹</span>
        <p className={styles.hint}>选择本地文件夹，作为文件列表的数据来源。</p>
        <div className={styles.row}>
          <div
            className={`${styles.path} ${dir ? '' : styles.empty}`}
            title={dir ?? undefined}
          >
            {/* bdi 避免 rtl 方向把路径开头的 "/" 渲染到末尾 */}
            {dir ? <bdi>{dir}</bdi> : api ? '未选择' : '仅在桌面应用中可用'}
          </div>
          <button
            type="button"
            className={styles.button}
            onClick={chooseFolder}
            disabled={!api}
          >
            选择文件夹…
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={() => update({ workspaceDir: null })}
            disabled={!dir}
          >
            清除
          </button>
        </div>
      </div>
    </div>
  )
}
