// pages/add/add.js
Page({
  data: {
    isEditing: false,
    editId: '',
    formData: {
      id: '',
      name: '',
      type: '',
      specification: '',
      status: '在库', // 默认选中在库
      quantity: 1,
      location: '',
      remarks: '',
      createTime: '',
      updateTime: ''
    },
    types: [],
    newTypeName: '',
    showAddTypeDialog: false,
    submitting: false
  },

  onLoad(options) {
    // 处理扫码传递的编号
    if (options.scanCode) {
      const scanCode = decodeURIComponent(options.scanCode);
      this.setData({
        'formData.id': scanCode,
        'formData.createTime': new Date().toISOString(),
        'formData.updateTime': new Date().toISOString()
      });
    } 
    // 处理编辑场景
    else if (options.editId) {
      this.setData({ 
        isEditing: true, 
        editId: options.editId 
      });
      this.loadEquipmentData(options.editId);
    } else {
      // 新增场景初始化时间
      this.setData({
        'formData.createTime': new Date().toISOString(),
        'formData.updateTime': new Date().toISOString()
      });
    }

    // 加载已有的器材类型
    this.loadEquipmentTypes();
  },

  // 加载器材类型列表
  loadEquipmentTypes() {
    try {
      const equipmentList = wx.getStorageSync('equipmentList') || [];
      const types = [...new Set(equipmentList.map(item => item.type).filter(Boolean))];
      this.setData({ types });
    } catch (err) {
      console.error('加载器材类型失败:', err);
    }
  },

  // 加载要编辑的器材数据
// 加载要编辑的器材数据
loadEquipmentData(id) {
  try {
    // 从云端获取数据
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'getEquipmentList',
      success: (res) => {
        wx.hideLoading();
        if (res.result.success) {
          const equipmentList = res.result.data || [];
          const equipment = equipmentList.find(item => item.id === id);
          
          if (equipment) {
            this.setData({
              formData: { ...equipment }
            });
          } else {
            wx.showToast({
              title: '未找到器材数据',
              icon: 'none'
            });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }
        } else {
          wx.showToast({
            title: res.result.message || '数据加载失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('加载器材数据失败:', err);
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
      }
    });
  } catch (err) {
    console.error('加载器材数据失败:', err);
    wx.showToast({
      title: '数据加载失败',
      icon: 'none'
    });
  }
},

// 添加保存方法（如果没有的话）
saveEquipment() {
  const { formData } = this.data;
  
  // 简单验证
  if (!formData.name || !formData.id) {
    wx.showToast({ title: '请填写必要信息', icon: 'none' });
    return;
  }
  
  wx.showLoading({ title: '保存中...' });
  
  // 调用全局方法保存到云端
  const app = getApp();
  app.globalData.addEquipment(formData)
    .then(result => {
      wx.hideLoading();
      if (result.success) {
        wx.showToast({ title: result.message || '保存成功' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({ title: result.message || '保存失败', icon: 'none' });
      }
    })
    .catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    });
} 
 ,

  // 输入框变化处理
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  // 类型选择变化
  onTypeChange(e) {
    const index = e.detail.value;
    this.setData({
      'formData.type': this.data.types[index]
    });
  },

  // 状态选择变化 - 确保只能二选一
  onStatusChange(e) {
    // 这里通过radio-group的change事件确保只能选择一个值
    this.setData({
      'formData.status': e.detail.value
    });
  },

  // 显示添加类型弹窗
  showAddTypeDialog() {
    this.setData({
      showAddTypeDialog: true,
      newTypeName: ''
    });
  },

  // 隐藏添加类型弹窗
  cancelAddType() {
    this.setData({
      showAddTypeDialog: false
    });
  },

  // 输入新类型名称
  onNewTypeInput(e) {
    this.setData({
      newTypeName: e.detail.value
    });
  },

  // 确认添加新类型
  confirmAddType() {
    const typeName = this.data.newTypeName.trim();
    if (!typeName) {
      wx.showToast({
        title: '请输入类型名称',
        icon: 'none'
      });
      return;
    }

    if (this.data.types.includes(typeName)) {
      wx.showToast({
        title: '该类型已存在',
        icon: 'none'
      });
      return;
    }

    // 添加新类型并选中
    const newTypes = [...this.data.types, typeName];
    this.setData({
      types: newTypes,
      'formData.type': typeName,
      showAddTypeDialog: false
    });
  },

  // 扫码获取编号
  scanCodeForId() {
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['barCode', 'qrCode'],
      success: (res) => {
        this.setData({
          'formData.id': res.result
        });
      },
      fail: (err) => {
        console.error('扫码失败:', err);
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        });
      }
    });
  },

  // 确认重置表单（二次确认）
  confirmReset() {
    wx.showModal({
      title: '确认重置',
      content: '确定要清空当前表单内容吗？',
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.resetForm();
        }
      }
    });
  },

  // 重置表单
  resetForm() {
    const initialData = {
      id: this.data.isEditing ? this.data.formData.id : '',
      name: '',
      type: '',
      specification: '',
      status: '在库', // 重置后默认选中在库
      quantity: 1,
      location: '',
      remarks: '',
      createTime: this.data.formData.createTime || new Date().toISOString(),
      updateTime: new Date().toISOString()
    };

    this.setData({
      formData: initialData
    });
  },

  // 提交表单
  submitForm() {
    const { formData } = this.data;
    
    // 简单验证
    if (!formData.id) {
      wx.showToast({ title: '请输入器材编号', icon: 'none' });
      return;
    }
    
    if (!formData.name) {
      wx.showToast({ title: '请输入器材名称', icon: 'none' });
      return;
    }
    
    if (!formData.type) {
      wx.showToast({ title: '请选择器材类型', icon: 'none' });
      return;
    }
    
    // 确保状态有值
    if (!formData.status) {
      formData.status = '在库';
    }
    
    this.setData({ submitting: true });
    
    try {
      let equipmentList = wx.getStorageSync('equipmentList') || [];
      // 更新时间戳
      formData.updateTime = new Date().toISOString();
      
      if (this.data.isEditing) {
        // 编辑模式：更新现有器材
        const index = equipmentList.findIndex(item => item.id === this.data.editId);
        if (index !== -1) {
          equipmentList[index] = formData;
        }
      } else {
        // 新增模式：添加新器材
        equipmentList.push(formData);
      }
      
      // 保存到本地存储
      wx.setStorageSync('equipmentList', equipmentList);
      
      wx.showToast({
        title: this.data.isEditing ? '更新成功' : '添加成功',
        icon: 'success'
      });
      
      // 延迟返回列表页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('保存器材失败:', err);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
      this.setData({ submitting: false });
    }
  },

  // 删除器材（仅编辑模式）
  deleteEquipment() {
    if (!this.data.isEditing || !this.data.editId) return;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该器材吗？此操作不可撤销。',
      confirmText: '删除',
      confirmColor: '#f4333c',
      success: (res) => {
        if (res.confirm) {
          try {
            let equipmentList = wx.getStorageSync('equipmentList') || [];
            // 过滤掉要删除的器材
            equipmentList = equipmentList.filter(item => item.id !== this.data.editId);
            // 保存到本地存储
            wx.setStorageSync('equipmentList', equipmentList);
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } catch (err) {
            console.error('删除器材失败:', err);
            wx.showToast({
              title: '删除失败，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  }
});
    