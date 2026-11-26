import { useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { FileListPanel, useFileList } from '../features/file-list'
import { FileViewerPanel, useEditableFile } from '../features/file-viewer'
import { useSettings } from '../features/settings'
import { StatsPanel } from '../features/stats'

/** 主窗口：持有"当前选中的文件"，在文件列表与文件内容区之间共享。 */
export function MainPage() {
  const { dir, files, error, loading } = useFileList()
  const [selection, setSelection] = useState<{ dir: string; name: string } | null>(null)

  // 选中项只在仍属于当前文件夹、且文件仍存在时有效；
  // 切换文件夹或文件被删除后自动视为未选中，无需手动清理状态
  const selectedFile =
    selection && selection.dir === dir && files.includes(selection.name)
      ? selection.name
      : null

  // 文件内容只在此处读取/编辑一次：中间区域编辑，右侧统计直接使用编辑中的文本，实时更新
  const { settings } = useSettings()
  const { outcome, text, saveState, setText, save } = useEditableFile(dir, selectedFile)

  return (
    <AppLayout
      left={
        <FileListPanel
          dir={dir}
          files={files}
          error={error}
          loading={loading}
          selectedFile={selectedFile}
          onSelect={(name) => dir && setSelection({ dir, name })}
        />
      }
      center={
        <FileViewerPanel
          fileName={selectedFile}
          outcome={outcome}
          text={text}
          saveState={saveState}
          categories={settings?.categories ?? []}
          onChange={setText}
          onSave={save}
        />
      }
      right={
        <StatsPanel
          fileName={selectedFile}
          content={outcome?.ok ? text : null}
          unreadable={outcome !== null && !outcome.ok}
        />
      }
    />
  )
}
