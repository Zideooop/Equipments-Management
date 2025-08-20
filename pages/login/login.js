// pages/login/login.js
Page({
  data: {
    username: '',
    password: '',
    loading: false
  },

  // 确保onLoad方法存在
  onLoad() {
    // 页面加载时检查是否已登录
    const hasLogin = wx.getStorageSync('hasLogin');
    if (hasLogin) {
      wx.navigateBack({ delta: 1 });
    }
  },

  // 用户名输入处理
  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  // 密码输入处理
  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  // 处理登录
  async handleLogin() {
    if (this.data.loading) return;
    
    const { username, password } = this.data;
    if (!username || !password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' });
      return;
    }
    
    this.setData({ loading: true });
    
    try {
      // 检查账号是否存在
      const checkRes = await wx.cloud.callFunction({
        name: 'checkAccountExists',
        data: { username }
      });
      
      if (!checkRes.result?.success) {
        throw new Error('检查账号失败');
      }
      
      if (!checkRes.result.exists) {
        // 账号不存在，提示注册
        wx.showModal({
          title: '账号不存在',
          content: '是否自动注册该账号？',
          success: async (modalRes) => {
            if (modalRes.confirm) {
              // 执行注册
              const regRes = await wx.cloud.callFunction({
                name: 'registerAccount',
                data: { 
                  username, 
                  password,
                  registerTime: new Date().toISOString()
                }
              });
              
              if (regRes.result?.success) {
                wx.showToast({ title: '注册成功，正在登录...', icon: 'none' });
                // 注册成功后登录
                this.doLogin(username, password);
              } else {
                this.setData({ loading: false });
                wx.showToast({ title: '注册失败', icon: 'none' });
              }
            } else {
              this.setData({ loading: false });
            }
          }
        });
      } else {
        // 账号存在，直接登录
        this.doLogin(username, password);
      }
    } catch (err) {
      console.error('检查账号失败', err);
      this.setData({ loading: false });
      wx.showToast({ title: '检查账号失败', icon: 'none' });
    }
  },

  // 执行登录
  async doLogin(username, password) {
    const app = getApp();
    const loginRes = await app.accountLogin(username, password);
    
    this.setData({ loading: false });
    if (loginRes.success) {
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 1000);
    } else {
      wx.showToast({ title: loginRes.message || '登录失败', icon: 'none' });
    }
  },

  // 微信登录
  async wechatLogin() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    const app = getApp();
    
    try {
      const res = await app.login();
      this.setData({ loading: false });
      
      if (res.success) {
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack({ delta: 1 });
        }, 1000);
      } else {
        wx.showToast({ title: res.message || '登录失败', icon: 'none' });
      }
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: '登录异常', icon: 'none' });
    }
  }
});
    