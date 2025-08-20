// app.js
App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        traceUser: true,
        env: 'cloudbase-5gx4izq3da5eda5e' // 替换为实际环境ID
      });
    }

    // 检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const hasLogin = wx.getStorageSync('hasLogin');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (hasLogin && userInfo) {
      this.globalData.hasLogin = hasLogin;
      this.globalData.userInfo = userInfo;
    }
  },

  globalData: {
    userInfo: null,
    hasLogin: false,
    equipmentList: []
  },

  // 获取器材列表方法（定义在App实例上）
  async getEquipmentList() {
    try {
      // 先尝试从云端获取
      const res = await wx.cloud.callFunction({
        name: 'getEquipmentList'
      });
      
      if (res.result?.success) {
        this.globalData.equipmentList = res.result.data;
        wx.setStorageSync('equipmentList', this.globalData.equipmentList);
        return this.globalData.equipmentList;
      }
      
      // 云端获取失败，使用本地缓存
      const localList = wx.getStorageSync('equipmentList') || [];
      this.globalData.equipmentList = localList;
      return localList;
    } catch (err) {
      console.error('获取器材列表失败', err);
      const localList = wx.getStorageSync('equipmentList') || [];
      this.globalData.equipmentList = localList;
      return localList;
    }
  },

  // 账号密码登录
  async accountLogin(username, password) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'verifyLogin',
        data: { username, password }
      });
      
      if (res.result?.success) {
        this.globalData.userInfo = res.result.userInfo;
        this.globalData.hasLogin = true;
        wx.setStorageSync('userInfo', res.result.userInfo);
        wx.setStorageSync('hasLogin', true);
        return { success: true };
      } else {
        return { success: false, message: res.result?.message || '账号或密码错误' };
      }
    } catch (err) {
      console.error('账号登录失败', err);
      return { success: false, message: '登录异常' };
    }
  },

  // 微信快捷登录
  async login() {
    try {
      const { code } = await wx.login();
      const res = await wx.cloud.callFunction({
        name: 'login',
        data: { code }
      });
      
      if (res.result?.success) {
        this.globalData.userInfo = res.result.userInfo;
        this.globalData.hasLogin = true;
        wx.setStorageSync('userInfo', res.result.userInfo);
        wx.setStorageSync('hasLogin', true);
        return { success: true };
      } else {
        return { success: false, message: res.result?.message || '登录失败' };
      }
    } catch (err) {
      console.error('登录失败', err);
      return { success: false, message: '登录异常' };
    }
  }
});
    