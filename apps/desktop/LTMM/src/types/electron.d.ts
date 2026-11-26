/** 与 electron/settings-store.js 中的 DEFAULTS 保持一致 */
export interface AppSettings {
  /** 用户选择的本地工作文件夹，未选择时为 null */
  workspaceDir: string | null
}

/** 与 electron/preload.cjs 暴露的 API 保持一致 */
export interface ElectronAPI {
  getSettings: () => Promise<AppSettings>
  updateSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>
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
