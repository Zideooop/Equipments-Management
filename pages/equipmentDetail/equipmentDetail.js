// pages/equipmentDetail/equipmentDetail.js
import { formatDate } from '../../utils/util'; // 修复：添加缺失的导入

Page({
  data: {
    equipment: {},
    isLoading: true,
    canBorrow: false,
    canReturn: false
  },

  onLoad(options) {
    const equipmentId = options.id;
    this.fetchEquipmentDetail(equipmentId);
  },

  fetchEquipmentDetail(id) {
    const app = getApp();
    this.setData({ isLoading: true });
    
    app.globalData.getEquipmentById(id)
      .then(equipment => {
        this.setData({
          equipment,
          isLoading: false,
          canBorrow: equipment.status === '在库',
          canReturn: equipment.status === '借出'
        });
      })
      .catch(err => {
        console.error('获取器材详情失败:', err);
        this.setData({ isLoading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  // 一键归还功能
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
          const now = new Date();
          const updatedEquipment = {
            ...equipment,
            status: '在库',
            returnTime: formatDate(now), // 修复：传入Date对象而非字符串
            updateTime: now.toISOString()
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
                  'equipment.updateTime': updatedEquipment.updateTime,
                  canBorrow: true,
                  canReturn: false
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

  // 一键借用功能
  borrowEquipment() {
    // 原有代码保持不变
    const that = this;
    const equipment = this.data.equipment;
    const userInfo = wx.getStorageSync('userInfo');
    
    if (!userInfo) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    
    wx.showModal({
      title: '借用确认',
      content: `确定要借用【${equipment.name}】吗？`,
      confirmText: '确认借用',
      cancelText: '取消',
      success(res) {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          
          const now = new Date();
          const updatedEquipment = {
            ...equipment,
            status: '借出',
            borrower: userInfo.username,
            borrowTime: formatDate(now),
            updateTime: now.toISOString()
          };
          
          const app = getApp();
          app.globalData.addOrUpdateEquipment(updatedEquipment)
            .then(result => {
              wx.hideLoading();
              
              if (result.success) {
                that.setData({
                  'equipment.status': '借出',
                  'equipment.borrower': userInfo.username,
                  'equipment.borrowTime': updatedEquipment.borrowTime,
                  'equipment.updateTime': updatedEquipment.updateTime,
                  canBorrow: false,
                  canReturn: true
                });
                
                wx.showToast({ title: '借用成功', icon: 'success' });
                that.recordActivity('借用');
              } else {
                wx.showToast({ 
                  title: result.message || '操作失败', 
                  icon: 'none' 
                });
              }
            })
            .catch(err => {
              wx.hideLoading();
              console.error('借用操作失败:', err);
              wx.showToast({ title: '操作失败', icon: 'none' });
            });
        }
      }
    });
  },

  // 记录操作活动
  recordActivity(type) {
    // 原有代码保持不变
    const equipment = this.data.equipment;
    const userInfo = wx.getStorageSync('userInfo');
    const app = getApp();
    
    const activity = {
      id: Date.now().toString(),
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      type,
      operator: userInfo.username,
      time: new Date().toISOString()
    };
    
    app.globalData.addActivityRecord(activity)
      .catch(err => console.error('记录活动失败:', err));
  },

  onShareAppMessage() {
    return {
      title: `查看${this.data.equipment.name}详情`,
      path: `/pages/equipmentDetail/equipmentDetail?id=${this.data.equipment.id}`
    };
  }
});
