Page({
  data: {
    equipment: {},
    currentId: ''
  },

  onLoad(options) {
    if (options && options.id) {
      this.setData({
        currentId: options.id
      });
      this.loadEquipmentDetail(options.id);
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 加载器材详情（从云端获取）
  loadEquipmentDetail(id) {
    wx.showLoading({ title: '加载中...' });
    
    const app = getApp();
    app.globalData.getEquipmentById(id)
      .then(equipment => {
        wx.hideLoading();
        
        if (equipment) {
          this.setData({
            equipment: equipment
          });
        } else {
          wx.showToast({
            title: '未找到器材信息',
            icon: 'none'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('加载器材详情失败:', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
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
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 编辑器材
  editEquipment() {
    wx.navigateTo({
      url: `/pages/add/add?editId=${this.data.currentId}`
    });
  },

  // 导出条码
  exportBarcode() {
    wx.showToast({
      title: '生成条码中...',
      icon: 'loading',
      duration: 1000
    });
    
    setTimeout(() => {
      wx.navigateTo({
        url: `/pages/qrcodeGenerator/qrcodeGenerator?id=${this.data.currentId}`
      });
    }, 1000);
  },

  // 删除器材（云存储版本）
  deleteEquipment() {
    const that = this;
    const equipmentName = this.data.equipment.name || '该器材';
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除【${equipmentName}】吗？此操作不可撤销。`,
      confirmText: '删除',
      confirmColor: '#f53f3f',
      cancelText: '取消',
      success(res) {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          
          const app = getApp();
          app.globalData.deleteEquipment(that.data.currentId)
            .then(result => {
              wx.hideLoading();
              
              if (result.success) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                
                // 记录删除动态
                that.recordActivity('删除');
                
                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
              } else {
                wx.showToast({
                  title: result.message || '删除失败',
                  icon: 'none'
                });
              }
            })
            .catch(err => {
              wx.hideLoading();
              console.error('删除器材失败:', err);
              wx.showToast({
                title: '删除失败，请重试',
                icon: 'none'
              });
            });
        }
      }
    });
  },

  // 一键借出功能（云存储版本）
  borrowEquipment() {
    const that = this;
    const equipment = this.data.equipment;
    
    wx.showModal({
      title: '借出确认',
      content: `确定要借出【${equipment.name}】吗？`,
      confirmText: '确认借出',
      cancelText: '取消',
      success(res) {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          
          // 更新器材状态
          const updatedEquipment = {
            ...equipment,
            status: '借出',
            borrowTime: that.formatDate(new Date().toISOString()),
            updateTime: new Date().toISOString()
          };
          
          // 调用全局方法更新到云端
          const app = getApp();
          app.globalData.addOrUpdateEquipment(updatedEquipment)
            .then(result => {
              wx.hideLoading();
              
              if (result.success) {
                // 更新页面数据
                that.setData({
                  'equipment.status': '借出',
                  'equipment.borrowTime': updatedEquipment.borrowTime,
                  'equipment.updateTime': updatedEquipment.updateTime
                });
                
                wx.showToast({ title: '借出成功', icon: 'success' });
                that.recordActivity('借出');
              } else {
                wx.showToast({ 
                  title: result.message || '操作失败', 
                  icon: 'none' 
                });
              }
            })
            .catch(err => {
              wx.hideLoading();
              console.error('借出操作失败:', err);
              wx.showToast({ title: '操作失败', icon: 'none' });
            });
        }
      }
    });
  },

  // 一键归还功能（云存储版本）
  returnEquipment() {
    const that = this;
    const equipment = this.data.equipment;
    
    wx.showModal({
      title: '归还确认',
      content: `确定要归还【${equipment.name}】吗？`,
      confirmText: '确认归还',
      cancelText: '取消',
      success(res) {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          
          // 更新器材状态
          const updatedEquipment = {
            ...equipment,
            status: '在库',
            returnTime: that.formatDate(new Date().toISOString()),
            updateTime: new Date().toISOString()
          };
          
          // 调用全局方法更新到云端
          const app = getApp();
          app.globalData.addOrUpdateEquipment(updatedEquipment)
            .then(result => {
              wx.hideLoading();
              
              if (result.success) {
                // 更新页面数据
                that.setData({
                  'equipment.status': '在库',
                  'equipment.returnTime': updatedEquipment.returnTime,
                  'equipment.updateTime': updatedEquipment.updateTime
                });
                
                wx.showToast({ title: '归还成功', icon: 'success' });
                that.recordActivity('归还');
              } else {
                wx.showToast({ 
                  title: result.message || '操作失败', 
                  icon: 'none' 
                });
              }
            })
            .catch(err => {
              wx.hideLoading();
              console.error('归还操作失败:', err);
              wx.showToast({ title: '操作失败', icon: 'none' });
            });
        }
      }
    });
  },

  // 记录操作动态（仍保存在本地）
  recordActivity(type) {
    const equipment = this.data.equipment;
    const now = new Date();
    
    const activity = {
      id: Date.now().toString(),
      type: type,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      content: `${type}了器材【${equipment.name}】`,
      time: now.toISOString(),
      formattedTime: this.formatDate(now.toISOString())
    };
    
    // 获取现有动态列表
    let activities = wx.getStorageSync('recentActivities') || [];
    // 添加新动态到最前面
    activities.unshift(activity);
    // 限制最多保存30条动态
    if (activities.length > 30) {
      activities = activities.slice(0, 30);
    }
    // 保存到本地存储
    wx.setStorageSync('recentActivities', activities);
  }
});
    