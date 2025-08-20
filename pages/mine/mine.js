// pages/mine/mine.js
Page({
  data: {
    userInfo: {},
    isLogin: false,
    cacheSize: '0.0MB'
  },

  onLoad: function() {
    this.checkLoginStatus();
    this.calculateCacheSize();
  },

  onShow: function() {
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus: function() {
    const hasLogin = wx.getStorageSync('hasLogin');
    const userInfo = wx.getStorageSync('userInfo') || {};
    
    this.setData({
      isLogin: !!hasLogin,
      userInfo: userInfo
    });
  },

  // 计算缓存大小
  calculateCacheSize: function() {
    const that = this;
    wx.getStorageInfo({
      success: function(res) {
        const size = (res.currentSize / 1024).toFixed(1);
        that.setData({
          cacheSize: `${size}MB`
        });
      }
    });
  },

  // 清除缓存
  clearCache: function() {
    const that = this;
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？',
      confirmText: '清除',
      success: function(res) {
        if (res.confirm) {
          wx.clearStorageSync();
          that.calculateCacheSize();
          wx.showToast({
            title: '缓存已清除',
            icon: 'success'
          });
          
          // 重新检查登录状态
          that.checkLoginStatus();
        }
      }
    });
  },

  // 前往登录页面
  goToLogin: function() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 退出登录
  logout: function() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmText: '退出',
      success: function(res) {
        if (res.confirm) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('hasLogin');
          
          // 更新全局状态
          getApp().globalData.userInfo = null;
          getApp().globalData.hasLogin = false;
          
          wx.reLaunch({
            url: '/pages/login/login'
          });
        }
      }
    });
  },

  // 显示关于信息
  showAbout: function() {
    wx.showModal({
      title: '关于系统',
      content: '器材管理系统 v1.0.0',
      showCancel: false
    });
  },

  // 前往设置页面
  goToSettings: function() {
    wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    });
  },

  // 前往编辑个人信息页面
  goToUserEdit: function() {
    wx.navigateTo({
      url: '/pages/userEdit/userEdit'
    });
  }
});
