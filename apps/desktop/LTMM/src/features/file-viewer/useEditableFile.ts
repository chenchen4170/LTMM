import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReadFileResult } from '../../types/electron'

export type FileOutcome = ReadFileResult | { ok: false; reason: 'error' }
export type SaveState = 'saved' | 'unsaved' | 'saving' | 'error'

/** 停止输入多久后自动保存 */
const SAVE_DELAY_MS = 800

interface Doc {
  key: string
  outcome: FileOutcome
  /** 编辑器中的文本（统一使用 \n 换行） */
  text: string
  /** 最近一次与磁盘一致的文本；text !== saved 表示有未保存的修改 */
  saved: string
  /** 原文件的换行符，保存时还原（文本框会把 CRLF 统一成 LF） */
  eol: '\n' | '\r\n'
}

interface Pending {
  dir: string
  fileName: string
  key: string
  text: string
  eol: Doc['eol']
}

/**
 * 读取选中的文件并支持编辑：修改后自动保存到磁盘。
 * - 停止输入后延迟保存；切换文件、窗口失焦/关闭、调用 save() 时立即保存
 * - 窗口重新获得焦点时从磁盘刷新，但有未保存修改时不会覆盖用户的草稿
 */
export function useEditableFile(dir: string | null, fileName: string | null) {
  const [doc, setDoc] = useState<Doc | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const [saving, setSaving] = useState(false)
  const [failedKey, setFailedKey] = useState<string | null>(null)
  const pending = useRef<Pending | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // 串行化写入，保证旧的写入不会在新的写入之后才完成而覆盖新内容
  const queue = useRef<Promise<void>>(Promise.resolve())

  const key = dir && fileName ? `${dir}\0${fileName}` : null
  const current = doc && doc.key === key ? doc : null

  const save = useCallback(() => {
    clearTimeout(timer.current)
    queue.current = queue.current.then(async () => {
      const p = pending.current
      const api = window.electronAPI
      if (!p || !api) return
      pending.current = null
      setSaving(true)
      try {
        await api.writeFile(p.dir, p.fileName, p.text.replace(/\n/g, p.eol))
        setFailedKey(null)
        setDoc((d) => (d && d.key === p.key ? { ...d, saved: p.text } : d))
      } catch {
        setFailedKey(p.key)
        // 保留以便下次重试；若用户在保存期间又输入了新内容，则保留较新的
        pending.current ??= p
      } finally {
        setSaving(false)
      }
    })
    return queue.current
  }, [])

  const setText = useCallback(
    (text: string) => {
      if (!key || !dir || !fileName || !current) return
      setDoc((d) => (d && d.key === key ? { ...d, text } : d))
      pending.current = { dir, fileName, key, text, eol: current.eol }
      clearTimeout(timer.current)
      timer.current = setTimeout(save, SAVE_DELAY_MS)
    },
    [key, dir, fileName, current, save],
  )

  // 窗口重新获得焦点时刷新磁盘内容；失焦或关闭窗口前把未保存的修改写入磁盘
  useEffect(() => {
    const onFocus = () => setRefreshTick((n) => n + 1)
    const onLeave = () => void save()
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onLeave)
    window.addEventListener('beforeunload', onLeave)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onLeave)
      window.removeEventListener('beforeunload', onLeave)
    }
  }, [save])

  // 切换文件（或卸载）时，立即保存上一个文件的未保存修改
  useEffect(() => () => void save(), [key, save])

  useEffect(() => {
    const api = window.electronAPI
    if (!key || !fileName || !api) return
    let cancelled = false

    const load = (outcome: FileOutcome) => {
      if (cancelled) return
      setDoc((prev) => {
        // 有未保存的修改时保留草稿，不用磁盘内容覆盖
        if (prev && prev.key === key && prev.text !== prev.saved) return prev
        const raw = outcome.ok ? outcome.content : ''
        const eol = raw.includes('\r\n') ? '\r\n' : '\n'
        const text = raw.replace(/\r\n/g, '\n')
        return { key, outcome, text, saved: text, eol }
      })
    }
    api.readFile(fileName).then(load, () => load({ ok: false, reason: 'error' }))

    return () => {
      cancelled = true
    }
  }, [key, fileName, refreshTick])

  const unsaved = current !== null && current.text !== current.saved
  const saveState: SaveState =
    failedKey !== null && failedKey === key
      ? 'error'
      : saving
        ? 'saving'
        : unsaved
          ? 'unsaved'
          : 'saved'

  return {
    /** 读取结果；加载中或未选中文件时为 null */
    outcome: current?.outcome ?? null,
    /** 编辑器中的当前文本（含未保存的修改） */
    text: current?.text ?? '',
    saveState,
    setText,
    save,
  }
}
