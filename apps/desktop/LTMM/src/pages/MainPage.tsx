import { useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { FileListPanel, useFileList } from '../features/file-list'
import { FileViewerPanel, useFileContent } from '../features/file-viewer'
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

  // 内容只读取一次，同时供中间的内容区和右侧的统计使用
  const outcome = useFileContent(dir, selectedFile)

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
      center={<FileViewerPanel fileName={selectedFile} outcome={outcome} />}
      right={
        <StatsPanel
          fileName={selectedFile}
          content={outcome?.ok ? outcome.content : null}
          unreadable={outcome !== null && !outcome.ok}
        />
      }
    />
  )
}
