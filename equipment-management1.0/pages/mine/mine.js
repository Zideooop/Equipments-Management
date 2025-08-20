// pages/mine/mine.js
Page({
  data: {
    userInfo: {},
    isLogin: false,
    cacheSize: '0.0MB',
    unreadCount: 2 // 未读消息数量，实际项目中从接口获取
  },

  onLoad: function() {
    // 初始化页面数据
    this.checkLoginStatus();
    this.calculateCacheSize();
  },

  onShow: function() {
    // 页面显示时刷新数据
    this.checkLoginStatus();
    this.calculateCacheSize();
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
        // 转换为MB并保留一位小数
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
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          wx.clearStorageSync();
          that.calculateCacheSize();
          wx.showToast({
            title: '缓存已清除',
            icon: 'success',
            duration: 1500
          });
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
    const that = this;
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmText: '退出',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          // 清除登录状态
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('hasLogin');
          
          // 更新全局状态
          getApp().globalData.userInfo = null;
          getApp().globalData.hasLogin = false;
          
          // 刷新页面数据
          that.checkLoginStatus();
          
          wx.showToast({
            title: '已退出登录',
            icon: 'none',
            duration: 1500
          });
        }
      }
    });
  },

  // 前往编辑个人信息页面
  goToUserEdit: function() {
    wx.navigateTo({
      url: '/pages/userEdit/userEdit'
    });
  },

  // 前往我的器材页面
  goToMyEquipments: function() {
    if (!this.data.isLogin) {
      this.showLoginTip();
      return;
    }
    
    wx.navigateTo({
      url: '/pages/myEquipments/myEquipments'
    });
  },

  // 前往借阅记录页面
  goToBorrowRecord: function() {
    if (!this.data.isLogin) {
      this.showLoginTip();
      return;
    }
    
    wx.navigateTo({
      url: '/pages/borrowRecord/borrowRecord'
    });
  },

  // 前往消息通知页面
  goToMessage: function() {
    if (!this.data.isLogin) {
      this.showLoginTip();
      return;
    }
    
    wx.navigateTo({
      url: '/pages/message/message'
    });
  },

  // 前往系统设置页面
  goToSettings: function() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  // 显示关于信息
  showAbout: function() {
    wx.showModal({
      title: '关于系统',
      content: '器材管理系统 v1.0.0\n\n一款便捷的器材管理工具，支持器材入库、借出、归还等功能',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // 未登录提示
  showLoginTip: function() {
    wx.showModal({
      title: '请先登录',
      content: '该功能需要登录后使用',
      confirmText: '去登录',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }
      }
    });
  }
});
