Component({
  properties: {
    current: {
      type: String,
      value: 'home'
    }
  },
  data: {},
  methods: {
    switchTab(e) {
      const path = e.currentTarget.dataset.path;
      const tab = e.currentTarget.dataset.tab;
      
      // 跳转到对应的页面
      wx.switchTab({
        url: path
      });
      
      // 更新当前选中状态
      this.setData({
        current: tab
      });
    }
  }
});
