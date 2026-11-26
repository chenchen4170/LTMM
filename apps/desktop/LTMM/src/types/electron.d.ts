/** 与 electron/settings-store.js 中的 DEFAULTS 保持一致 */
export interface AppSettings {
  /** 用户选择的本地工作文件夹，未选择时为 null */
  workspaceDir: string | null
  /** 用户维护的分类列表；名称不含空白字符且不重复 */
  categories: string[]
}

/** 读取文件内容的结果；失败原因：超过大小上限 / 二进制文件 / 不是普通文件 */
export type ReadFileResult =
  | { ok: true; content: string }
  | { ok: false; reason: 'too-large' | 'binary' | 'not-a-file' }

/** 与 electron/preload.cjs 暴露的 API 保持一致 */
export interface ElectronAPI {
  getSettings: () => Promise<AppSettings>
  updateSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>
  /** 工作文件夹下的文件名（不递归、不含隐藏文件）；未设置文件夹时为空数组 */
  listFiles: () => Promise<string[]>
  /** 读取工作文件夹中某个文件的文本内容，只接受文件名而非路径 */
  readFile: (name: string) => Promise<ReadFileResult>
  /** 批量读取多个文件的文本内容，返回 { 文件名: 内容 }；无法读取的文件会被跳过 */
  readFiles: (names: string[]) => Promise<Record<string, string>>
  /** 覆盖写入已存在的文件；dir 必须等于当前工作文件夹，否则拒绝 */
  writeFile: (dir: string, name: string, content: string) => Promise<void>
  /** 弹出系统文件夹选择框；用户取消时返回 null */
  selectFolder: () => Promise<string | null>
  /** 订阅设置变化，返回取消订阅函数 */
  onSettingsChanged: (callback: (settings: AppSettings) => void) => () => void
}

declare global {
  interface Window {
    /** 仅在 Electron 中存在；浏览器里直接打开 dev server 时为 undefined */
    electronAPI?: ElectronAPI
  }
}
