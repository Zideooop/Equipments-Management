Page({
  data: {
    // 批量添加表单数据
    formData: {
      category: '',
      manufacturer: '',
      purchaseYear: '',
      count: 1,
      prefix: '',
      startNumber: 1
    },
    categories: [], // 器材类别列表
    loading: false,
    successCount: 0
  },

  onLoad() {
    // 从本地存储加载已有类别（避免重复）
    this.loadCategories();
  },

  // 从本地存储加载已有类别
  loadCategories() {
    const app = getApp();
    const equipmentList = app.globalData.getEquipmentList();
    
    // 提取所有不重复的类别
    const categorySet = new Set();
    equipmentList.forEach(item => {
      if (item.category) {
        categorySet.add(item.category);
      }
    });
    
    this.setData({
      categories: Array.from(categorySet)
    });
  },

  // 表单输入变化处理
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  // 批量添加提交
  // 批量添加提交
submitBatchAdd() {
  const { category, manufacturer, purchaseYear, count, prefix, startNumber } = this.data.formData;
  
  // 简单验证
  if (!category || !manufacturer || !purchaseYear || !prefix) {
    wx.showToast({
      title: '请填写必填项',
      icon: 'none',
      duration: 2000
    });
    return;
  }
  
  const countNum = parseInt(count);
  const startNum = parseInt(startNumber);
  
  if (isNaN(countNum) || countNum <= 0 || countNum > 100) {
    wx.showToast({
      title: '数量必须是1-100的数字',
      icon: 'none',
      duration: 2000
    });
    return;
  }
  
  if (isNaN(startNum) || startNum < 0) {
    wx.showToast({
      title: '起始编号必须是非负数字',
      icon: 'none',
      duration: 2000
    });
    return;
  }
  
  this.setData({ loading: true });
  
  // 生成批量数据
  const equipmentList = [];
  for (let i = 0; i < countNum; i++) {
    equipmentList.push({
      name: `${prefix}${startNum + i}`,
      category,
      manufacturer,
      purchaseYear,
      status: '正常',
      remark: `批量添加的器材 #${startNum + i}`,
      id: `batch-${Date.now()}-${i}` // 生成唯一ID
    });
  }
  
  // 调用全局方法批量保存到云端
  const app = getApp();
  app.globalData.batchAddEquipment(equipmentList)
    .then(result => {
      this.setData({ loading: false });
      
      if (result.success) {
        const successCount = equipmentList.length;
        this.setData({ successCount });
        
        wx.showToast({
          title: `成功添加${successCount}个器材`,
          icon: 'success',
          duration: 2000
        });
        
        // 2秒后返回列表页
        setTimeout(() => {
          wx.navigateBack();
        }, 2000);
      } else {
        wx.showToast({
          title: result.message || '添加失败',
          icon: 'none',
          duration: 2000
        });
      }
    })
    .catch(err => {
      this.setData({ loading: false });
      wx.showToast({ title: '添加失败', icon: 'none' });
    });
}
,

  // 取消操作
  cancel() {
    wx.navigateBack();
  }
});
