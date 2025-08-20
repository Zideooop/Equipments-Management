// pages/index/index.js
// 关键修复：必须使用小程序标准的Page()构造函数
Page({
  data: {
    totalEquipments: 0,
    availableEquipments: 0,
    borrowedEquipments: 0,
    recentActivities: [],
    isMenuOpen: false,
    isScanning: false,
    loading: false
  },

  // 正确定义生命周期函数
  onLoad() {
    this.loadLocalData();
    this.loadRecentActivities();
  },

  onShow() {
    this.loadLocalData();
    this.loadRecentActivities();
  },

  // 下拉刷新
  onPullDownRefresh() {
    wx.showNavigationBarLoading();
    
    // 直接调用数据加载方法，移除固定延迟
    Promise.all([this.loadLocalData(true), this.loadRecentActivities(true)])
      .then(() => {
        wx.hideNavigationBarLoading();
        wx.showToast({
          title: '刷新成功',
          icon: 'success',
          duration: 1500
        });
        wx.stopPullDownRefresh();
      })
      .catch(() => {
        wx.hideNavigationBarLoading();
        wx.showToast({
          title: '刷新失败',
          icon: 'none',
          duration: 1500
        });
        wx.stopPullDownRefresh();
      });
  },

  // 加载器材数据（云存储版本）
  loadLocalData(isRefresh = false) {
    if (!isRefresh) {
      this.setData({ loading: true });
    }
    
    try {
      // 从云端加载数据
      const app = getApp();
      app.globalData.getEquipmentList().then(equipmentList => {
        const availableCount = equipmentList.filter(item => item.status === '在库').length;
        const borrowedCount = equipmentList.filter(item => item.status === '借出').length;
        
        this.setData({
          totalEquipments: equipmentList.length,
          availableEquipments: availableCount,
          borrowedEquipments: borrowedCount,
          loading: false
        });
      }).catch(err => {
        console.error('加载器材数据失败:', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
      });
    } catch (err) {
      console.error('加载器材数据失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    }
  },

  // 加载最近动态（云存储版本）
  loadRecentActivities(isRefresh = false) {
    return new Promise((resolve, reject) => {
      try {
        // 从云端获取器材列表
        const app = getApp();
        app.globalData.getEquipmentList().then(equipmentList => {
          const activities = [];
          
          equipmentList.forEach(item => {
            let type, content;
            
            if (item.status === '借出') {
              type = '借出';
              content = `${item.name} 已被借出`;
            } else if (item.status === '在库') {
              if (item.createTime && new Date(item.createTime).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000) {
                type = '新增';
                content = `新增器材: ${item.name}`;
              } else {
                type = '归还';
                content = `${item.name} 已归还入库`;
              }
            }
            
            const time = item.updateTime || item.createTime || new Date().toISOString();
            
            if (type && time) {
              activities.push({
                type,
                content,
                time: time,
                formattedTime: this.formatDate(time),
                equipmentName: item.name,
                id: item.id
              });
            }
          });
          
          // 按时间排序，最新的在前
          activities.sort((a, b) => new Date(b.time) - new Date(a.time));
          
          this.setData({
            recentActivities: activities.slice(0, 5)
          });
          
          resolve();
        }).catch(err => {
          console.error('加载最近动态失败:', err);
          reject(err);
        });
      } catch (err) {
        console.error('加载最近动态失败:', err);
        reject(err);
      }
    });
  },

  // 时间格式化
  formatDate(dateString) {
    if (!dateString) return '未知时间';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return '未知时间';
    }
    
    const year = date.getFullYear();
    const month = this.padZero(date.getMonth() + 1);
    const day = this.padZero(date.getDate());
    const hour = this.padZero(date.getHours());
    const minute = this.padZero(date.getMinutes());
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  padZero(num) {
    return num < 10 ? '0' + num : num;
  },

  toggleMenu() {
    this.setData({
      isMenuOpen: !this.data.isMenuOpen
    });
  },

  goToEquipmentList(e) {
    const status = e.currentTarget.dataset.status || '';
    
    wx.setStorageSync('equipmentFilterStatus', status);
    
    let filterText = '全部';
    if (status === '在库') filterText = '可借器材';
    if (status === '借出') filterText = '已借器材';
    wx.setStorageSync('currentFilterText', filterText);
    
    wx.switchTab({
      url: '/pages/equipmentList/equipmentList'
    });
  },

  goToActivityDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({
        url: `/pages/equipmentDetail/equipmentDetail?id=${id}`
      });
    } else {
      wx.showToast({
        title: '无法获取器材信息',
        icon: 'none'
      });
    }
  },

  scanCode() {
    if (this.data.isScanning) return;
    
    this.setData({ 
      isScanning: true,
      isMenuOpen: false
    });
    
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['barCode', 'qrCode'],
      success: (res) => {
        const result = res.result;
        wx.showToast({ title: '扫码成功', icon: 'success', duration: 1000 });
        
        // 从云端查找扫码结果对应的器材
        const app = getApp();
        app.globalData.getEquipmentList().then(equipmentList => {
          const foundItem = equipmentList.find(item => item.code === result || item.id === result);
          
          if (foundItem) {
            setTimeout(() => {
              wx.navigateTo({ url: `/pages/equipmentDetail/equipmentDetail?id=${foundItem.id}` });
            }, 1000);
          } else {
            setTimeout(() => {
              wx.showModal({
                title: '未找到器材',
                content: '是否添加新器材？',
                confirmText: '录入',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.navigateTo({ url: `/pages/add/add?scanCode=${encodeURIComponent(result)}` });
                  }
                }
              });
            }, 1000);
          }
        });
      },
      fail: (err) => {
        console.error('扫码失败:', err);
        wx.showToast({ title: '扫码失败', icon: 'none' });
      },
      complete: () => {
        this.setData({ isScanning: false });
      }
    });
  },

  goToAdd() {
    wx.navigateTo({ url: '/pages/add/add' });
    this.setData({ isMenuOpen: false });
  },

  goToQrcodeGenerator() {
    wx.navigateTo({ url: '/pages/qrcodeGenerator/qrcodeGenerator' });
    this.setData({ isMenuOpen: false });
  }
});
    