// pages/index/index.js
Page({
  data: {
    totalEquipment: 0,
    borrowedCount: 0,
    warningCount: 0,
    recentRecords: []
  },

  onLoad() {
    this.loadLocalData();
    this.loadRecentActivities();
  },

  onShow() {
    this.loadLocalData();
    this.loadRecentActivities();
  },

  // 加载本地器材数据
  async loadLocalData() {
    try {
      const app = getApp();
      // 修复调用方式：从app实例调用，而非globalData
      const equipmentList = await app.getEquipmentList();
      
      const total = equipmentList.length;
      const borrowed = equipmentList.filter(item => item.status === 'borrowed').length;
      const warning = equipmentList.filter(item => item.needMaintenance).length;
      
      this.setData({
        totalEquipment: total,
        borrowedCount: borrowed,
        warningCount: warning
      });
    } catch (err) {
      console.error('加载器材数据失败:', err);
    }
  },

  // 加载最近动态
  async loadRecentActivities() {
    try {
      const app = getApp();
      // 修复调用方式：从app实例调用，而非globalData
      const equipmentList = await app.getEquipmentList();
      
      const recent = [...equipmentList]
        .sort((a, b) => new Date(b.updateTime || b.createTime) - new Date(a.updateTime || a.createTime))
        .slice(0, 5)
        .map(item => ({
          id: item.id,
          name: item.name,
          action: item.status === 'borrowed' ? '已借出' : '在库中',
          time: this.formatTime(item.updateTime || item.createTime)
        }));
      
      this.setData({ recentRecords: recent });
    } catch (err) {
      console.error('加载最近动态失败:', err);
    }
  },

  // 时间格式化工具
  formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  },
  
  // 跳转到器材列表
  toEquipmentList() {
    wx.navigateTo({ url: '/pages/equipmentList/equipmentList' });
  },
  
  // 跳转到借出列表
  toBorrowedList() {
    wx.navigateTo({ url: '/pages/borrowedList/borrowedList' });
  },
  
  // 跳转到需维护列表
  toWarningList() {
    wx.navigateTo({ url: '/pages/warningList/warningList' });
  },
  
  // 显示操作菜单
  showActionSheet() {
    wx.showActionSheet({
      itemList: ['新增器材', '扫码录入', '生成二维码'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            wx.navigateTo({ url: '/pages/add/add' });
            break;
          case 1:
            wx.navigateTo({ url: '/pages/scan/scan' });
            break;
          case 2:
            wx.navigateTo({ url: '/pages/qrcodeGenerator/qrcodeGenerator' });
            break;
        }
      }
    });
  }
});
    