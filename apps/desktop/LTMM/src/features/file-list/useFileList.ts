import { useEffect, useState } from 'react'
import { useSettings } from '../settings'

interface Result {
  dir: string
  files: string[]
  error: boolean
}

/** 读取工作文件夹下的文件名；工作文件夹变化或窗口重新获得焦点时刷新。 */
export function useFileList() {
  const { settings } = useSettings()
  const dir = settings?.workspaceDir ?? null
  const [result, setResult] = useState<Result | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  // 用户在系统文件管理器里增删文件后，切回应用时自动刷新
  useEffect(() => {
    const onFocus = () => setRefreshTick((n) => n + 1)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  useEffect(() => {
    const api = window.electronAPI
    if (!dir || !api) return
    let cancelled = false
    api
      .listFiles()
      .then((files) => !cancelled && setResult({ dir, files, error: false }))
      .catch(() => !cancelled && setResult({ dir, files: [], error: true }))
    return () => {
      cancelled = true
    }
  }, [dir, refreshTick])

  // 结果与当前文件夹不匹配（刚切换文件夹、尚未返回）视为加载中
  const current = result && result.dir === dir ? result : null
  return {
    dir,
    files: current?.files ?? [],
    error: current?.error ?? false,
    loading: dir !== null && current === null,
  }
}
