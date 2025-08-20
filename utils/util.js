// 日期格式化工具函数
export function formatDate(date) {
  // 修复：确保输入为Date对象，如果是字符串则转换
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  // 检查是否为有效日期
  if (isNaN(targetDate.getTime())) {
    return '';
  }
  
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 其他原有工具函数保持不变
export function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  }
}
