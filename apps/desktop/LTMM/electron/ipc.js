import { BrowserWindow, dialog, ipcMain } from 'electron';
import { listFileNames, readTextFile, writeTextFile } from './files.js';
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

  // 列出已保存的工作文件夹中的文件名。路径只取自设置，不接受渲染进程传入，
  // 避免页面被利用来读取任意目录。未设置文件夹时返回空列表。
  ipcMain.handle('files:list', async () => {
    const { workspaceDir } = getSettings();
    return workspaceDir ? listFileNames(workspaceDir) : [];
  });

  // 读取工作文件夹中指定文件的内容；同样只信任设置里的路径，渲染进程只传文件名。
  ipcMain.handle('files:read', (_event, name) =>
    readTextFile(getSettings().workspaceDir, name),
  );

  // 写入工作文件夹中的文件。渲染进程需同时传入它认为的工作文件夹：
  // 若与当前设置不一致（例如编辑期间用户在设置里切换了文件夹），拒绝写入，
  // 防止把旧文件夹中文件的内容写进新文件夹里的同名文件。
  ipcMain.handle('files:write', (_event, dir, name, content) => {
    const { workspaceDir } = getSettings();
    if (!workspaceDir || dir !== workspaceDir) {
      throw new Error('Workspace folder changed');
    }
    return writeTextFile(workspaceDir, name, content);
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
