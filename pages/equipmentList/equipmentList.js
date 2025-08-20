// pages/equipmentList/equipmentList.js
Page({
  data: {
    equipmentList: [],
    searchValue: '',
    filteredList: []
  },

  // 确保onLoad方法存在
  onLoad() {
    this.loadEquipmentData();
  },

  onShow() {
    this.loadEquipmentData();
  },

  // 加载器材数据
  async loadEquipmentData() {
    try {
      const app = getApp();
      // 修复调用方式：从app实例调用，而非globalData
      const list = await app.getEquipmentList();
      
      this.setData({
        equipmentList: list,
        filteredList: list
      });
    } catch (err) {
      console.error('加载器材数据失败:', err);
    }
  },

  // 搜索过滤
  onSearchInput(e) {
    const value = e.detail.value.trim().toLowerCase();
    const filtered = this.data.equipmentList.filter(item => 
      item.name.toLowerCase().includes(value) || 
      item.code.toLowerCase().includes(value)
    );
    
    this.setData({
      searchValue: value,
      filteredList: filtered
    });
  },

  // 跳转到器材详情
  toEquipmentDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/equipmentDetail/equipmentDetail?id=${id}` });
  },

  // 跳转到新增器材页
  toAddEquipment() {
    wx.navigateTo({ url: '/pages/add/add' });
  },

  // 返回上一页
  navigateBack() {
    wx.navigateBack({ delta: 1 });
  }
});
    