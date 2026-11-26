import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

/** 用户设置的默认值；新增设置项时在此登记，同时更新 src/types/electron.d.ts。 */
const DEFAULTS = {
  /** 用户选择的本地工作文件夹，未选择时为 null */
  workspaceDir: null,
  /** 用户维护的分类列表（添加记录时可选） */
  categories: [],
};

const MAX_CATEGORIES = 200;
const MAX_CATEGORY_LENGTH = 50;

/**
 * 校验分类列表：每项为非空字符串，不含任何空白字符（记录格式用空格分隔分类与描述），
 * 长度有限且不重复。不合法时抛出异常。
 */
function validateCategories(value) {
  if (!Array.isArray(value) || value.length > MAX_CATEGORIES) {
    throw new TypeError('categories must be an array');
  }
  for (const name of value) {
    if (
      typeof name !== 'string' ||
      name.length === 0 ||
      name.length > MAX_CATEGORY_LENGTH ||
      /\s/.test(name)
    ) {
      throw new TypeError(`Invalid category: ${JSON.stringify(name)}`);
    }
  }
  if (new Set(value).size !== value.length) {
    throw new TypeError('Duplicate category');
  }
  return [...value];
}

let cache = null;

const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');

export function getSettings() {
  if (cache) return cache;
  try {
    const saved = JSON.parse(fs.readFileSync(settingsFile(), 'utf8'));
    cache = { ...DEFAULTS, ...saved };
    // 设置文件被手动改坏时回退为默认值，而不是让界面拿到错误类型的数据
    try {
      cache.categories = validateCategories(cache.categories);
    } catch {
      cache.categories = [];
    }
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
  if ('categories' in patch) {
    next.categories = validateCategories(patch.categories);
  }
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(next, null, 2));
  cache = next;
  return cache;
}
