// 提示工具类，保持原有功能并添加图标
export function showToast(title, type = 'info') {
  // 创建toast元素
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // 根据类型添加对应图标
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg class="toast-icon" width="32" height="32" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  } else if (type === 'error' || type === 'warning') {
    iconSvg = `<svg class="toast-icon" width="32" height="32" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }
  
  // 设置toast内容
  toast.innerHTML = `${iconSvg}<text class="toast-text">${title}</text>`;
  document.body.appendChild(toast);
  
  // 自动关闭
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// 保持原有确认弹窗功能
export function showConfirm(options) {
  const { title, content, confirmText = '确认', cancelText = '取消', confirmCallback, cancelCallback } = options;
  
  const confirmBox = document.createElement('div');
  confirmBox.className = 'confirm-box';
  confirmBox.innerHTML = `
    <div class="confirm-content">
      <text class="confirm-title">${title}</text>
      <text class="confirm-message">${content}</text>
      <div class="confirm-buttons">
        <button class="cancel-btn">${cancelText}</button>
        <button class="confirm-btn">${confirmText}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(confirmBox);
  
  // 绑定事件
  confirmBox.querySelector('.cancel-btn').addEventListener('click', () => {
    confirmBox.remove();
    if (cancelCallback) cancelCallback();
  });
  
  confirmBox.querySelector('.confirm-btn').addEventListener('click', () => {
    confirmBox.remove();
    if (confirmCallback) confirmCallback();
  });
}
    