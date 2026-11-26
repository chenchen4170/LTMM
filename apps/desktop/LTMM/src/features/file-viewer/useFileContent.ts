import { useEffect, useState } from 'react'
import type { ReadFileResult } from '../../types/electron'

export type FileOutcome = ReadFileResult | { ok: false; reason: 'error' }

interface Loaded {
  key: string
  outcome: FileOutcome
}

/** 读取选中文件的文本内容；加载中或未选中文件时返回 null。文件切换或窗口重新获得焦点时刷新。 */
export function useFileContent(dir: string | null, fileName: string | null) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const key = dir && fileName ? `${dir}\0${fileName}` : null

  // 在外部编辑器里修改文件后，切回应用时自动刷新内容
  useEffect(() => {
    const onFocus = () => setRefreshTick((n) => n + 1)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  useEffect(() => {
    const api = window.electronAPI
    if (!key || !fileName || !api) return
    let cancelled = false
    api
      .readFile(fileName)
      .then((outcome) => !cancelled && setLoaded({ key, outcome }))
      .catch(
        () => !cancelled && setLoaded({ key, outcome: { ok: false, reason: 'error' } }),
      )
    return () => {
      cancelled = true
    }
  }, [key, fileName, refreshTick])

  // 结果对应的不是当前选中文件（刚切换、尚未返回）视为加载中
  return loaded && loaded.key === key ? loaded.outcome : null
}
