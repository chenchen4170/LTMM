const MAX_LENGTH = 50

/**
 * 校验分类名，合法返回 null，否则返回给用户看的错误信息。
 * @param others 其他已存在的分类（用于查重；重命名时应排除自身）
 * 规则与 electron/settings-store.js 保持一致。
 */
export function validateCategoryName(name: string, others: string[]): string | null {
  if (name === '') return '分类名不能为空'
  if (/\s/.test(name)) return '分类名不能包含空格'
  if (name.length > MAX_LENGTH) return `分类名不能超过 ${MAX_LENGTH} 个字符`
  if (others.includes(name)) return '分类已存在'
  return null
}
