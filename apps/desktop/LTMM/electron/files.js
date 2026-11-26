import fs from 'node:fs/promises';
import path from 'node:path';

/** 超过此大小的文件不在界面中展示/编辑，避免渲染卡顿 */
const MAX_READ_BYTES = 1024 * 1024;

/**
 * 列出文件夹下（不递归）的文件名：只包含文件，忽略以 "." 开头的隐藏文件，
 * 按文件名排序。
 */
export async function listFileNames(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/**
 * 把"工作文件夹 + 文件名"解析为完整路径。
 * 渲染进程只能传文件名：必须是单纯的文件名（不含路径分隔符、不是 ".." 等），
 * 否则拒绝，防止通过 "../" 访问工作文件夹之外的文件。
 */
function resolveInWorkspace(dir, name) {
  if (!dir) throw new Error('No workspace folder set');
  if (typeof name !== 'string' || !name || path.basename(name) !== name || name === '..') {
    throw new Error('Invalid file name');
  }
  return path.join(dir, name);
}

/**
 * 读取工作文件夹下某个文件的文本内容。
 *
 * 返回 { ok: true, content } 或 { ok: false, reason }，
 * reason: 'too-large' | 'binary' | 'not-a-file'
 */
export async function readTextFile(dir, name) {
  const fullPath = resolveInWorkspace(dir, name);
  const stat = await fs.stat(fullPath);
  if (!stat.isFile()) return { ok: false, reason: 'not-a-file' };
  if (stat.size > MAX_READ_BYTES) return { ok: false, reason: 'too-large' };

  const buffer = await fs.readFile(fullPath);
  // 含 NUL 字节基本可判定为二进制文件（图片、docx 等）
  if (buffer.includes(0)) return { ok: false, reason: 'binary' };

  return { ok: true, content: buffer.toString('utf8').replace(/^\uFEFF/, '') };
}

/**
 * 覆盖写入工作文件夹下一个已存在的文本文件（不会新建文件）。
 * 先写入同目录下的隐藏临时文件再改名替换，写到一半崩溃也不会损坏原文件。
 */
export async function writeTextFile(dir, name, content) {
  const fullPath = resolveInWorkspace(dir, name);
  if (typeof content !== 'string') throw new TypeError('content must be a string');
  if (Buffer.byteLength(content, 'utf8') > MAX_READ_BYTES) throw new Error('Content too large');

  const stat = await fs.stat(fullPath);
  if (!stat.isFile()) throw new Error('Not a regular file');

  const tmpPath = path.join(dir, `.${name}.${process.pid}.tmp`);
  try {
    await fs.writeFile(tmpPath, content, { mode: stat.mode & 0o777 });
    await fs.rename(tmpPath, fullPath);
  } catch (err) {
    await fs.rm(tmpPath, { force: true });
    throw err;
  }
}
