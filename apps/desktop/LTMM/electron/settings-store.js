import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

/** 用户设置的默认值；新增设置项时在此登记，同时更新 src/types/electron.d.ts。 */
const DEFAULTS = {
  /** 用户选择的本地工作文件夹，未选择时为 null */
  workspaceDir: null,
};

let cache = null;

const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');

export function getSettings() {
  if (cache) return cache;
  try {
    const saved = JSON.parse(fs.readFileSync(settingsFile(), 'utf8'));
    cache = { ...DEFAULTS, ...saved };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

/** 合并并持久化设置，只接受已登记的字段，返回最新设置。 */
export function updateSettings(patch) {
  const next = { ...getSettings() };
  if ('workspaceDir' in patch) {
    const dir = patch.workspaceDir;
    if (dir !== null && typeof dir !== 'string') {
      throw new TypeError('workspaceDir must be a string or null');
    }
    next.workspaceDir = dir;
  }
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(next, null, 2));
  cache = next;
  return cache;
}
