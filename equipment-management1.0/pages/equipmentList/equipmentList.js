// pages/equipmentList/equipmentList.js
Page({
  data: {
    equipmentList: [],
    displayList: [],
    searchText: '',
    activeCategory: '',
    activeStatus: '',
    categories: [],
    hasFiltered: false,
    loading: true
  },

  onLoad(options) {
    // 修复：确保正确接收从首页传递的筛选参数
    if (options && options.status) {
      this.setData({
        activeStatus: decodeURIComponent(options.status)
      });
    }
    this.loadEquipmentData();
  },

  onShow() {
    this.loadEquipmentData();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadEquipmentData();
    wx.stopPullDownRefresh();
  },

// 加载器材数据
loadEquipmentData() {
  this.setData({ loading: true });
  
  try {
    // 从云端加载数据
    const app = getApp();
    app.globalData.getEquipmentList().then(equipmentList => {
      const categories = [...new Set(equipmentList.map(item => item.type).filter(Boolean))];
      
      this.setData({
        equipmentList,
        categories
      }, () => {
        this.applyFilters();
        this.setData({ loading: false });
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
}
  ,

  // 应用所有筛选条件
  applyFilters() {
    const { equipmentList, searchText, activeCategory, activeStatus } = this.data;
    let filteredList = [...equipmentList];
    
    // 搜索文本筛选
    if (searchText) {
      const text = searchText.toLowerCase();
      filteredList = filteredList.filter(item => 
        (item.name && item.name.toLowerCase().includes(text)) || 
        (item.code && item.code.toLowerCase().includes(text)) ||
        (item.specification && item.specification.toLowerCase().includes(text))
      );
    }
    
    // 类别筛选
    if (activeCategory) {
      filteredList = filteredList.filter(item => item.type === activeCategory);
    }
    
    // 状态筛选（确保正确应用从首页传递的状态）
    if (activeStatus) {
      filteredList = filteredList.filter(item => item.status === activeStatus);
    }
    
    this.setData({
      displayList: filteredList,
      hasFiltered: !!searchText || !!activeCategory || !!activeStatus
    });
  },

  // 搜索输入处理
  onSearchInput(e) {
    this.setData({ searchText: e.detail.value }, () => {
      this.applyFilters();
    });
  },

  // 选择类别
  selectCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ activeCategory: category }, () => {
      this.applyFilters();
    });
  },

  // 选择状态
  selectStatus(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ activeStatus: status }, () => {
      this.applyFilters();
    });
  },

  // 清除所有筛选条件
  clearFilters() {
    this.setData({
      searchText: '',
      activeCategory: '',
      activeStatus: '',
    }, () => {
      this.applyFilters();
    });
  },

  // 跳转到器材详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({
        url: `/pages/equipmentDetail/equipmentDetail?id=${id}`
      });
    }
  },

  // 跳转到添加器材页
  goToAdd() {
    wx.navigateTo({
      url: '/pages/add/add'
    });
  },

  // 格式化日期显示
  formatDate(dateString) {
    if (!dateString) return '未知时间';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = this.padZero(date.getMonth() + 1);
    const day = this.padZero(date.getDate());
    const hour = this.padZero(date.getHours());
    const minute = this.padZero(date.getMinutes());
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 数字补零
  padZero(num) {
    return num < 10 ? '0' + num : num;
  }
});
    