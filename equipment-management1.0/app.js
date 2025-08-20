App({
  onLaunch() {
    // 初始化云开发环境（启用云功能）
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        traceUser: true,
        // 如需指定环境，取消注释并填写环境ID
        // env: 'your-environment-id'
      });
      console.log('云开发环境初始化成功');
    }

    // 初始化本地存储结构（兼容旧数据）
    this.initLocalStorage();
    
    // 检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    try {
      const hasLogin = wx.getStorageSync('hasLogin');
      
      if (hasLogin !== true) {
        console.log('未检测到登录状态，跳转到登录页');
        wx.reLaunch({
          url: '/pages/login/login',
          fail: (err) => {
            console.error('跳转登录页失败:', err);
            wx.showToast({
              title: '登录页面加载失败',
              icon: 'none',
              duration: 3000
            });
            
            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/index/index'
              });
            }, 3000);
          }
        });
      } else {
        console.log('已登录，进入首页');
      }
    } catch (err) {
      console.error('登录状态检查失败:', err);
      wx.reLaunch({
        url: '/pages/login/login'
      });
    }
  },

  // 初始化本地存储结构（兼容旧数据）
  initLocalStorage() {
    const requiredKeys = [
      'qrcodeHistory',    // 二维码历史（仍保留在本地）
      'systemConfig',     // 系统配置（仍保留在本地）
    ];

    // 确保所有必要的本地存储键存在
    requiredKeys.forEach(key => {
      if (!wx.getStorageSync(key)) {
        wx.setStorageSync(key, []);
      }
    });
    
    // 处理登录状态
    if (wx.getStorageSync('hasLogin') === undefined) {
      wx.setStorageSync('hasLogin', false);
    }

    // 检查是否需要从本地迁移数据到云端（首次启动云功能时）
    this.migrateLocalDataToCloud();
  },

  // 迁移本地数据到云端（仅执行一次）
  async migrateLocalDataToCloud() {
    // 检查是否已迁移过
    const hasMigrated = wx.getStorageSync('dataMigratedToCloud');
    if (hasMigrated) return;

    try {
      // 获取本地器材数据
      const localEquipments = wx.getStorageSync('equipmentList') || [];
      if (localEquipments.length > 0) {
        console.log(`发现${localEquipments.length}条本地数据，开始迁移到云端...`);
        
        // 调用云函数批量添加
        const res = await this.globalData.batchAddEquipment(localEquipments);
        
        if (res.success) {
          console.log('本地数据迁移成功');
          // 标记为已迁移
          wx.setStorageSync('dataMigratedToCloud', true);
          // 清除本地器材数据，避免冲突
          wx.removeStorageSync('equipmentList');
        } else {
          console.error('本地数据迁移失败:', res.message);
        }
      }
    } catch (err) {
      console.error('数据迁移过程出错:', err);
    }
  },

  // 全局数据和云操作方法
  globalData: {
    // 登录处理方法
    loginAsTourist() {
      wx.setStorageSync('hasLogin', true);
      wx.setStorageSync('userInfo', {
        username: '游客',
        role: '游客',
        avatar: '/images/default-avatar.png'
      });
      
      wx.reLaunch({
        url: '/pages/index/index'
      });
    },
    
    loginAsUser(username) {
      wx.setStorageSync('hasLogin', true);
      wx.setStorageSync('userInfo', {
        username: username || '管理员',
        role: '管理员',
        avatar: '/images/default-avatar.png'
      });
      
      wx.reLaunch({
        url: '/pages/index/index'
      });
    },

    // 退出登录
    logout() {
      wx.setStorageSync('hasLogin', false);
      wx.setStorageSync('userInfo', null);
      
      wx.reLaunch({
        url: '/pages/login/login'
      });
    },

    // 获取用户信息
    getUserInfo() {
      return wx.getStorageSync('userInfo') || {
        username: '未知用户',
        role: '游客',
        avatar: '/images/default-avatar.png'
      };
    },

    // 云存储：获取所有器材
    async getEquipmentList() {
      try {
        const res = await wx.cloud.callFunction({
          name: 'getEquipmentList'
        });
        
        if (res.result.success) {
          return res.result.data || [];
        }
        console.error('获取器材列表失败:', res.result.message);
        return [];
      } catch (err) {
        console.error('调用云函数失败:', err);
        // 失败时尝试返回本地缓存的旧数据
        return wx.getStorageSync('equipmentList') || [];
      }
    },

    // 云存储：添加或更新单个器材
    async addOrUpdateEquipment(equipment) {
      try {
        // 确保有时间戳
        const now = new Date().toISOString();
        if (!equipment.createTime) {
          equipment.createTime = now;
        }
        equipment.updateTime = now;
        
        // 确保有唯一ID
        if (!equipment.id) {
          equipment.id = Date.now().toString() + Math.floor(Math.random() * 1000);
        }
        
        const res = await wx.cloud.callFunction({
          name: 'saveEquipment',
          data: { equipment }
        });
        
        return res.result;
      } catch (err) {
        console.error('添加/更新器材失败:', err);
        // 失败时尝试保存到本地作为备份
        let list = wx.getStorageSync('equipmentList') || [];
        const index = list.findIndex(item => item.id === equipment.id);
        
        if (index !== -1) {
          list[index] = { ...list[index], ...equipment };
        } else {
          list.unshift(equipment);
        }
        wx.setStorageSync('equipmentList', list);
        
        return { 
          success: false, 
          message: '网络异常，已保存到本地',
          data: equipment
        };
      }
    },

    // 云存储：批量添加器材
    async batchAddEquipment(equipmentList) {
      try {
        // 为每个器材添加必要信息
        const equipList = equipmentList.map(item => {
          const now = new Date().toISOString();
          return {
            ...item,
            id: item.id || Date.now().toString() + Math.floor(Math.random() * 1000),
            createTime: item.createTime || now,
            updateTime: now
          };
        });
        
        const res = await wx.cloud.callFunction({
          name: 'batchSaveEquipment',
          data: { equipmentList: equipList }
        });
        
        return res.result;
      } catch (err) {
        console.error('批量添加器材失败:', err);
        return { success: false, message: err.message };
      }
    },

    // 云存储：根据ID获取单个器材
    async getEquipmentById(id) {
      try {
        const list = await this.getEquipmentList();
        return list.find(item => item.id === id) || null;
      } catch (err) {
        console.error('获取单个器材失败:', err);
        // 失败时尝试从本地获取
        const localList = wx.getStorageSync('equipmentList') || [];
        return localList.find(item => item.id === id) || null;
      }
    },

    // 云存储：删除器材
    async deleteEquipment(id) {
      try {
        const res = await wx.cloud.callFunction({
          name: 'deleteEquipment',
          data: { id }
        });
        
        return res.result;
      } catch (err) {
        console.error('删除器材失败:', err);
        // 失败时尝试从本地删除
        let list = wx.getStorageSync('equipmentList') || [];
        list = list.filter(item => item.id !== id);
        wx.setStorageSync('equipmentList', list);
        
        return { 
          success: false, 
          message: '网络异常，已从本地删除'
        };
      }
    },

    // 云存储：获取所有器材类型
    async getEquipmentTypes() {
      try {
        const list = await this.getEquipmentList();
        const types = new Set();
        list.forEach(item => {
          if (item.type) types.add(item.type);
        });
        return Array.from(types);
      } catch (err) {
        console.error('获取器材类型失败:', err);
        // 失败时尝试从本地获取
        const localList = wx.getStorageSync('equipmentList') || [];
        const types = new Set();
        localList.forEach(item => {
          if (item.type) types.add(item.type);
        });
        return Array.from(types);
      }
    }
  }
});
    