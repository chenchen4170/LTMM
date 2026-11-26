// 预加载脚本：通过 contextBridge 向渲染进程暴露受限 API。
// 必须是 CommonJS（沙箱化 preload 不支持 ESM）。
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (patch) => ipcRenderer.invoke('settings:update', patch),
  listFiles: () => ipcRenderer.invoke('files:list'),
  readFile: (name) => ipcRenderer.invoke('files:read', name),
  selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),
  /** 订阅设置变化，返回取消订阅函数 */
  onSettingsChanged: (callback) => {
    const listener = (_event, settings) => callback(settings);
    ipcRenderer.on('settings:changed', listener);
    return () => ipcRenderer.removeListener('settings:changed', listener);
  },
});
