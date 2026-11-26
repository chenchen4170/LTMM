import { app, Menu } from 'electron';
import { openSettingsWindow } from './windows.js';

const isMac = process.platform === 'darwin';

const settingsItem = {
  label: 'Settings…',
  accelerator: 'CmdOrCtrl+,',
  click: () => openSettingsWindow(),
};

export function buildAppMenu() {
  const template = [
    // macOS：应用菜单（即 "Electron" 菜单），Settings 放在 About 之后
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              settingsItem,
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : [
          // Windows / Linux：放在 File 菜单
          {
            label: 'File',
            submenu: [settingsItem, { type: 'separator' }, { role: 'quit' }],
          },
        ]),
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
