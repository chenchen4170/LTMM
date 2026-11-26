import { useEffect, useState } from 'react'

const NONE: Record<string, string> = {}

/**
 * 批量读取工作文件夹中多个文件的内容（周/月统计用）。
 * 只在文件夹或文件名集合真正变化时重新读取（用拼接出的 key 比较，
 * 调用方每次渲染传入新数组也没关系）；窗口重新获得焦点时刷新，
 * 以便用户在别处修改文件后统计保持最新。加载中返回 null。
 */
export function useFileTexts(dir: string | null, names: string[]) {
  const [loaded, setLoaded] = useState<{ key: string; texts: Record<string, string> } | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const key = dir && names.length > 0 ? `${dir}\0${names.join('\0')}` : null

  useEffect(() => {
    const onFocus = () => setRefreshTick((n) => n + 1)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  useEffect(() => {
    const api = window.electronAPI
    if (!key || !api) return
    let cancelled = false
    const [, ...fileNames] = key.split('\0') // key = 文件夹 + 各文件名，文件名里不可能含 \0
    api
      .readFiles(fileNames)
      .then((texts) => !cancelled && setLoaded({ key, texts }))
      .catch(() => !cancelled && setLoaded({ key, texts: {} }))
    return () => {
      cancelled = true
    }
  }, [key, refreshTick])

  if (key === null) return NONE
  return loaded && loaded.key === key ? loaded.texts : null
}
