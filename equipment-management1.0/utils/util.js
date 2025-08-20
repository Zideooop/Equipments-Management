// 移除原generateBarcode函数，统一使用wxbarcode.js中的实现
// 保留其他工具函数（如果有）
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}