const QRCode = require('../../utils/wxqrcode.js');

Page({
  data: {
    // 二维码内容
    content: '',
    // 二维码尺寸选项
    sizeOptions: ['200px', '300px', '400px', '500px'],
    sizeIndex: 2, // 默认400px
    qrcodeSize: 400,
    // 纠错级别选项
    errorLevelOptions: ['低 (7%)', '中 (15%)', '高 (25%)', '最高 (30%)'],
    errorLevelIndex: 1, // 默认中级
    errorLevel: 'M',
    // 状态控制
    hasGenerated: false,
    hasError: false,
    errorMessage: '',
    // 历史记录
    historyList: []
  },

  onLoad(options) {
    // 如果从其他页面传递了内容
    if (options && options.content) {
      this.setData({
        content: options.content
      }, () => {
        this.generateQrCode();
      });
    }
    
    // 加载历史记录
    this.loadHistory();
  },

  // 输入内容变化
  onInputChange(e) {
    this.setData({
      content: e.detail.value
    });
  },

  // 清除错误状态
  clearError() {
    if (this.data.hasError) {
      this.setData({
        hasError: false,
        errorMessage: ''
      });
    }
  },

  // 尺寸变化
  onSizeChange(e) {
    const index = e.detail.value;
    const size = parseInt(this.data.sizeOptions[index]);
    
    this.setData({
      sizeIndex: index,
      qrcodeSize: size
    }, () => {
      if (this.data.hasGenerated) {
        this.generateQrCode(false);
      }
    });
  },

  // 纠错级别变化
  onErrorLevelChange(e) {
    const errorLevels = ['L', 'M', 'Q', 'H'];
    const index = e.detail.value;
    
    this.setData({
      errorLevelIndex: index,
      errorLevel: errorLevels[index]
    }, () => {
      if (this.data.hasGenerated) {
        this.generateQrCode(false);
      }
    });
  },

  // 生成二维码
  generateQrCode(showToast = true) {
    const { content, qrcodeSize, errorLevel } = this.data;
    
    // 验证输入
    if (!content.trim()) {
      this.setData({
        hasError: true,
        errorMessage: '请输入二维码内容',
        hasGenerated: false
      });
      return;
    }
    
    if (content.length > 200) {
      this.setData({
        hasError: true,
        errorMessage: '内容过长，请控制在200字符以内',
        hasGenerated: false
      });
      return;
    }
    
    // 清除错误状态
    this.setData({
      hasError: false,
      errorMessage: ''
    });
    
    // 生成二维码
    const success = QRCode.createQrCode('qrcode', content, qrcodeSize, errorLevel);
    
    if (success) {
      this.setData({
        hasGenerated: true
      });
      
      // 保存到历史记录
      this.saveToHistory(content);
      
      // 显示成功提示
      if (showToast) {
        wx.showToast({
          title: '二维码生成成功',
          icon: 'success',
          duration: 1000
        });
      }
      
      // 滚动到二维码显示区域
      wx.pageScrollTo({
        selector: '.qrcode-container',
        duration: 300
      });
    } else {
      this.setData({
        hasGenerated: false,
        hasError: true,
        errorMessage: '生成二维码失败，请重试'
      });
    }
  },

  // 清空输入
  clearInput() {
    this.setData({
      content: '',
      hasError: false,
      errorMessage: '',
      hasGenerated: false
    });
  },

  // 保存二维码到相册
  saveQrCode() {
    if (!this.data.hasGenerated) return;
    
    wx.canvasToTempFilePath({
      canvasId: 'qrcode',
      width: this.data.qrcodeSize,
      height: this.data.qrcodeSize,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.showToast({
              title: '保存成功',
              icon: 'success'
            });
          },
          fail: (err) => {
            console.error('保存失败:', err);
            if (err.errMsg.indexOf('auth deny') > -1) {
              wx.showModal({
                title: '授权失败',
                content: '请允许访问相册以保存二维码图片',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting({
                      success: (settingRes) => {
                        if (settingRes.authSetting['scope.writePhotosAlbum']) {
                          this.saveQrCode();
                        }
                      }
                    });
                  }
                }
              });
            } else {
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              });
            }
          }
        });
      },
      fail: (err) => {
        console.error('转换图片失败:', err);
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    }, this);
  },

  // 扫码识别
  scanQrCode() {
    wx.scanCode({
      onlyFromCamera: false, // 允许从相册选择
      scanType: ['qrCode'], // 只识别二维码
      success: (res) => {
        wx.showModal({
          title: '识别结果',
          content: res.result,
          showCancel: false,
          confirmText: '复制内容',
          success: () => {
            wx.setClipboardData({
              data: res.result,
              success: () => {
                wx.showToast({
                  title: '已复制到剪贴板',
                  icon: 'success',
                  duration: 1000
                });
              }
            });
          }
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

  // 加载历史记录
  loadHistory() {
    const history = wx.getStorageSync('qrcodeHistory') || [];
    this.setData({
      historyList: history
    });
  },

  // 保存到历史记录
  saveToHistory(content) {
    let history = wx.getStorageSync('qrcodeHistory') || [];
    
    // 去重，如果已存在则移到最前
    const index = history.indexOf(content);
    if (index > -1) {
      history.splice(index, 1);
    }
    
    // 添加到开头
    history.unshift(content);
    
    // 限制最多保存20条
    if (history.length > 20) {
      history = history.slice(0, 20);
    }
    
    // 保存到本地存储
    wx.setStorageSync('qrcodeHistory', history);
    
    // 更新页面显示
    this.setData({
      historyList: history
    });
  },

  // 加载历史记录中的内容
  loadHistoryItem(e) {
    const index = e.currentTarget.dataset.index;
    const content = this.data.historyList[index];
    
    this.setData({
      content
    }, () => {
      this.generateQrCode();
    });
  },

  // 清空历史记录
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？',
      confirmText: '清空',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('qrcodeHistory');
          this.setData({
            historyList: []
          });
          wx.showToast({
            title: '已清空',
            icon: 'none'
          });
        }
      }
    });
  }
});
