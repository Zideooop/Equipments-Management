// pages/userEdit/userEdit.js
Page({
  data: {
    userInfo: {},
    username: '',
    phone: '',
    email: '',
    avatar: '',
    loading: false
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
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 临时图片路径
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          avatar: tempFilePath
        });
        
        // 这里可以直接上传图片到云存储
        this.uploadAvatar(tempFilePath);
      }
    });
  },

  // 上传头像到云存储
  uploadAvatar(tempFilePath) {
    wx.showLoading({ title: '上传中...' });
    
    // 生成唯一文件名
    const fileName = `avatars/${Date.now()}-${Math.random().toString(36).substr(2, 10)}.png`;
    
    wx.cloud.uploadFile({
      cloudPath: fileName,
      fileContent: Buffer.from(tempFilePath, 'base64'),
      success: (res) => {
        wx.hideLoading();
        
        if (res.fileID) {
          // 更新头像URL
          this.setData({
            avatar: res.fileID
          });
          
          // 同时更新到数据库
          this.updateUserAvatar(res.fileID);
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('上传头像失败', err);
        wx.showToast({ title: '上传失败', icon: 'none' });
      }
    });
  },

  // 更新头像到数据库
  updateUserAvatar(avatarUrl) {
    wx.cloud.callFunction({
      name: 'updateUserInfo',
      data: {
        id: this.data.userInfo.id,
        avatar: avatarUrl
      },
      success: res => {
        console.log('头像更新成功');
      },
      fail: err => {
        console.error('头像更新失败', err);
      }
    });
  },

  // 保存修改
  saveUserInfo() {
    if (!this.data.username.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    
    // 调用云函数更新用户信息
    wx.cloud.callFunction({
      name: 'updateUserInfo',
      data: {
        id: this.data.userInfo.id,
        username: this.data.username,
        phone: this.data.phone,
        email: this.data.email,
        // 如果头像有更新，包含头像信息
        ...(this.data.avatar && { avatar: this.data.avatar })
      },
      success: res => {
        this.setData({ loading: false });
        
        if (res.result.code === 0 && res.result.success) {
          // 更新本地存储
          const updatedUser = { ...this.data.userInfo, ...res.result.userInfo };
          wx.setStorageSync('userInfo', updatedUser);
          getApp().globalData.userInfo = updatedUser;
          
          wx.showToast({ title: '修改成功' });
          setTimeout(() => wx.navigateBack(), 1000);
        } else {
          wx.showToast({ 
            title: res.result.message || '修改失败', 
            icon: 'none' 
          });
        }
      },
      fail: err => {
        this.setData({ loading: false });
        console.error('更新失败', err);
        wx.showToast({ title: '修改失败', icon: 'none' });
      }
    });
  }
});
