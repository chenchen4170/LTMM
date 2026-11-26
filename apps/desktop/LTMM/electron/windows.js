import { BrowserWindow } from 'electron';
import path from 'node:path';

const PRELOAD = path.join(import.meta.dirname, 'preload.cjs');
const DIST_INDEX = path.join(import.meta.dirname, '../dist/index.html');

/** 加载渲染进程页面；hash 用于区分窗口（如 '/settings'）。 */
function loadRenderer(win, hash = '') {
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    return win.loadURL(hash ? `${devUrl}#${hash}` : devUrl);
  }
  return win.loadFile(DIST_INDEX, hash ? { hash } : undefined);
}

const webPreferences = {
  preload: PRELOAD,
  contextIsolation: true,
  nodeIntegration: false,
};

export function createMainWindow() {
  const win = new BrowserWindow({ width: 1200, height: 760, webPreferences });
  loadRenderer(win);
  return win;
}

let settingsWindow = null;

/** 打开设置窗口；已打开则聚焦，保证只有一个实例。 */
export function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (settingsWindow.isMinimized()) settingsWindow.restore();
    settingsWindow.focus();
    return settingsWindow;
  }

  settingsWindow = new BrowserWindow({
    width: 560,
    height: 380,
    title: 'Settings',
    minimizable: false,
    fullscreenable: false,
    webPreferences,
  });
  // 固定窗口标题，避免被页面 <title> 覆盖
  settingsWindow.on('page-title-updated', (e) => e.preventDefault());
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
  loadRenderer(settingsWindow, '/settings');
  return settingsWindow;
}
