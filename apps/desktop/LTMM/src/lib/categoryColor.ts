/** 由分类名稳定地映射到色相（0~359），同一分类在统计和时间线里颜色一致。 */
export function categoryHue(category: string): number {
  let hash = 5381
  for (let i = 0; i < category.length; i++) {
    hash = ((hash << 5) + hash + category.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 360
}
