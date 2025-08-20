// pages/login/login.js
Page({
  data: {
    username: '',
    password: '',
    loading: false,
    showPassword: false
  },

  onLoad: function() {
    // 检查是否已登录，已登录则跳转到首页
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus: function() {
    const hasLogin = wx.getStorageSync('hasLogin');
    if (hasLogin) {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  // 用户名输入处理
  onUsernameInput: function(e) {
    this.setData({
      username: e.detail.value
    });
  },

  // 密码输入处理
  onPasswordInput: function(e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 密码显示切换
  togglePasswordVisibility: function() {
    this.setData({
      showPassword: !this.data.showPassword
    });
  },

  // 微信快捷登录（核心实现）
  onWechatAuth: function(e) {
    if (!e.detail.userInfo) {
      wx.showToast({
        title: '授权失败',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    // 1. 获取微信用户信息
    const userInfo = e.detail.userInfo;

    // 2. 调用微信登录接口获取code
    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          wx.showToast({ title: '登录失败', icon: 'none' });
          this.setData({ loading: false });
          return;
        }

        // 3. 调用云函数完成登录流程
        wx.cloud.callFunction({
          name: 'wechatLogin',
          data: {
            code: loginRes.code,
            userInfo: userInfo
          },
          success: (cloudRes) => {
            this.setData({ loading: false });
            
            if (cloudRes.result.success) {
              // 4. 登录成功，保存用户信息
              const userData = cloudRes.result.userInfo;
              wx.setStorageSync('userInfo', userData);
              wx.setStorageSync('hasLogin', true);
              
              // 更新全局状态
              getApp().globalData.userInfo = userData;
              getApp().globalData.hasLogin = true;
              
              wx.showToast({
                title: '登录成功',
                icon: 'success'
              });
              
              // 跳转到首页
              setTimeout(() => {
                wx.switchTab({
                  url: '/pages/index/index'
                });
              }, 1000);
            } else {
              wx.showToast({
                title: '登录失败',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            console.error('微信登录失败:', err);
            this.setData({ loading: false });
            wx.showToast({
              title: '登录异常，请重试',
              icon: 'none'
            });
          }
        });
      },
      fail: (err) => {
        console.error('获取code失败:', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      }
    });
  },

  // 账号密码登录（保留原有功能）
  handleLogin: function() {
    const { username, password } = this.data;

    if (!username || !password) {
      wx.showToast({
        title: '请输入账号和密码',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    // 模拟登录过程
    setTimeout(() => {
      wx.setStorageSync('username', username);
      wx.setStorageSync('hasLogin', true);
      
      // 构造用户信息
      const userInfo = {
        username: username,
        avatar: '/images/default-avatar.png'
      };
      wx.setStorageSync('userInfo', userInfo);
      getApp().globalData.userInfo = userInfo;

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }, 1000);
    }, 1500);
  }
});
