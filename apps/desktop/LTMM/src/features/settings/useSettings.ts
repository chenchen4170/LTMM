import { useCallback, useEffect, useState } from 'react'
import type { AppSettings } from '../../types/electron'

/** 读取并订阅用户设置；非 Electron 环境下返回 null。 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const api = window.electronAPI

  useEffect(() => {
    if (!api) return
    let cancelled = false
    api.getSettings().then((s) => {
      if (!cancelled) setSettings(s)
    })
    const unsubscribe = api.onSettingsChanged(setSettings)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [api])

  const update = useCallback(
    (patch: Partial<AppSettings>) => api?.updateSettings(patch),
    [api],
  )

  return { settings, update }
}
