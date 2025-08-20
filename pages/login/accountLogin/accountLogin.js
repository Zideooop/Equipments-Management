// pages/login/accountLogin/accountLogin.js
Page({
  data: {
    username: '',
    password: ''
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 用户名输入
  onUsernameChange(e) {
    this.setData({
      username: e.detail.value
    });
  },

  // 密码输入
  onPasswordChange(e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 提交登录
  submitLogin() {
    const { username, password } = this.data;
    
    // 简单验证
    if (!username.trim()) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none'
      });
      return;
    }
    
    if (!password) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return;
    }
    
    // 模拟登录验证
    wx.showLoading({
      title: '登录中...'
    });
    
    setTimeout(() => {
      wx.hideLoading();
      
      // 这里只是模拟，实际项目中应该调用后端接口验证
      if (username === 'admin' && password === 'admin123') {
        // 保存登录状态和用户信息
        wx.setStorageSync('hasLogin', true);
        wx.setStorageSync('userInfo', {
          username: '管理员',
          role: '系统管理员',
          avatar: '/images/admin-avatar.png'
        });
        
        // 跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        });
      } else {
        wx.showToast({
          title: '用户名或密码错误',
          icon: 'none'
        });
      }
    }, 1500);
  },

  // 忘记密码
  forgetPassword() {
    wx.showToast({
      title: '密码找回功能开发中',
      icon: 'none'
    });
  },

  // 注册账号
  register() {
    wx.showToast({
      title: '注册功能开发中',
      icon: 'none'
    });
  }
});
    