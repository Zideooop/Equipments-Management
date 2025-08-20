// pages/userEdit/userEdit.js
Page({
  data: {
    userInfo: {},
    username: '',
    phone: '',
    email: '',
    avatar: '',
    loading: false,
    tempAvatarPath: '' // 修复：添加临时头像路径变量
  },

  onLoad() {
    // 检查登录状态
    const hasLogin = wx.getStorageSync('hasLogin');
    if (!hasLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    // 获取当前用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    this.setData({
      userInfo,
      username: userInfo.username || '',
      phone: userInfo.phone || '',
      email: userInfo.email || '',
      avatar: userInfo.avatar || ''
    });
  },

  // 输入框变化处理
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ 
      [field]: e.detail.value 
    });
  },

  // 选择头像
  chooseAvatar() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        // 修复：保存临时路径用于上传
        const tempFilePath = res.tempFilePaths[0];
        that.setData({
          tempAvatarPath: tempFilePath,
          avatar: tempFilePath // 临时显示
        });
      }
    });
  },

  // 保存用户信息
  saveUserInfo() {
    const that = this;
    const { username, phone, email, userInfo, tempAvatarPath } = this.data;
    
    if (!username.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }
    
    this.setData({ loading: true });
    
    // 先处理头像上传（如果有新头像）
    const uploadAvatar = () => {
      // 修复：只有存在临时头像路径时才上传
      if (!tempAvatarPath) {
        return Promise.resolve(userInfo.avatar || '');
      }
      
      return new Promise((resolve, reject) => {
        const app = getApp();
        const fileName = `avatars/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
        
        wx.uploadFile({
          url: `${app.globalData.apiUrl}/upload`,
          filePath: tempAvatarPath, // 修复：使用临时路径上传
          name: 'file',
          formData: { 'filePath': fileName },
          success(res) {
            const data = JSON.parse(res.data);
            if (data.success) {
              resolve(data.url);
            } else {
              reject(new Error('头像上传失败'));
            }
          },
          fail(err) {
            reject(err);
          }
        });
      });
    };
    
    // 执行保存流程
    uploadAvatar()
      .then(avatarUrl => {
        const updatedUser = {
          ...userInfo,
          username,
          phone,
          email,
          avatar: avatarUrl,
          updateTime: new Date().toISOString()
        };
        
        // 调用全局方法更新用户信息
        const app = getApp();
        return app.globalData.updateUserInfo(updatedUser);
      })
      .then(result => {
        this.setData({ loading: false });
        
        if (result.success) {
          // 更新本地存储
          wx.setStorageSync('userInfo', result.userInfo);
          wx.showToast({ title: '保存成功', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({ title: result.message || '保存失败', icon: 'none' });
        }
      })
      .catch(err => {
        console.error('保存用户信息失败:', err);
        this.setData({ loading: false });
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
  }
});
