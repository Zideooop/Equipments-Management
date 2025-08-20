// pages/manage/manage.js
Page({
  data: {
    equipmentList: [],        // 所有器材数据
    displayList: [],          // 筛选后展示的列表
    searchKeyword: '',        // 搜索关键词
    activeFilters: {          // 活跃的筛选条件
      type: '',
      status: ''
    },
    isLoading: true,          // 加载状态
    hasFiltered: false        // 是否进行过筛选操作
  },

  onLoad() {
    this.loadEquipmentData();
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadEquipmentData();
  },

  // 加载器材数据（云存储版本）
  loadEquipmentData() {
    this.setData({ isLoading: true });

    // 从云端加载数据
    const app = getApp();
    app.globalData.getEquipmentList().then(equipmentList => {
      this.setData({
        equipmentList: equipmentList,
        displayList: equipmentList,
        isLoading: false
      }, () => {
        // 如果有筛选条件，重新应用筛选
        if (this.data.hasFiltered) {
          this.applyFilters();
        }
      });
    }).catch(err => {
      console.error('加载器材数据失败:', err);
      this.setData({ isLoading: false });
      wx.showToast({ title: '数据加载失败', icon: 'none' });
    });
  },

  // 搜索输入处理
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  // 清除搜索关键词
  clearSearch() {
    this.setData({ searchKeyword: '' });
  },

  // 按类型筛选
  filterByType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'activeFilters.type': type,
      hasFiltered: true
    }, () => {
      this.applyFilters();
    });
  },

  // 按状态筛选
  filterByStatus(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      'activeFilters.status': status,
      hasFiltered: true
    }, () => {
      this.applyFilters();
    });
  },

  // 清除所有筛选条件
  clearAllFilters() {
    this.setData({
      searchKeyword: '',
      activeFilters: {
        type: '',
        status: ''
      },
      hasFiltered: false,
      displayList: this.data.equipmentList
    });
  },

  // 应用筛选条件（优化筛选逻辑）
  applyFilters() {
    const { equipmentList, searchKeyword, activeFilters } = this.data;
    let filteredList = [...equipmentList];
    
    // 1. 类型筛选
    if (activeFilters.type) {
      filteredList = filteredList.filter(item => item.type === activeFilters.type);
    }
    
    // 2. 状态筛选
    if (activeFilters.status) {
      filteredList = filteredList.filter(item => item.status === activeFilters.status);
    }
    
    // 3. 关键词搜索（优化：多字段匹配，忽略大小写）
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filteredList = filteredList.filter(item => {
        // 检查多个字段是否包含关键词
        const matchesId = item.id && item.id.toLowerCase().includes(keyword);
        const matchesName = item.name && item.name.toLowerCase().includes(keyword);
        const matchesType = item.type && item.type.toLowerCase().includes(keyword);
        const matchesLocation = item.location && item.location.toLowerCase().includes(keyword);
        const matchesDesc = item.description && item.description.toLowerCase().includes(keyword);
        
        return matchesId || matchesName || matchesType || matchesLocation || matchesDesc;
      });
    }
    
    this.setData({
      displayList: filteredList,
      hasFiltered: true
    });
  },

  // 前往器材详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/equipmentDetail/equipmentDetail?id=${id}`
    });
  }
})
    