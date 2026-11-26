import { BrowserWindow, dialog, ipcMain } from 'electron';
import { getSettings, updateSettings } from './settings-store.js';

export function registerIpcHandlers() {
  ipcMain.handle('settings:get', () => getSettings());

  ipcMain.handle('settings:update', (_event, patch) => {
    const settings = updateSettings(patch);
    // 通知所有窗口（主窗口与设置窗口）设置已变化
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('settings:changed', settings);
    }
    return settings;
  });

  // 弹出系统文件夹选择框；取消时返回 null
  ipcMain.handle('dialog:select-folder', async (event) => {
    const parent = BrowserWindow.fromWebContents(event.sender);
    const options = {
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: getSettings().workspaceDir ?? undefined,
    };
    const { canceled, filePaths } = parent
      ? await dialog.showOpenDialog(parent, options)
      : await dialog.showOpenDialog(options);
    return canceled ? null : filePaths[0];
  });
}
