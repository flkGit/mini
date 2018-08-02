const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    openid: null,
    userId: null,
    list: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let that = this
    wx.getStorage({
      key: 'openid',
      success: function(res) {
        that.data.openid = res.data
        wx.getStorage({
          key: 'userId',
          success: function (res) {
            that.data.userId = res.data
            that.getList();
          },
        })
      },
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    
  },
  /**
   * 获取培训班列表
   */
  getList: function(){
    let that = this
    wx.request({
      url: app.globalData.apiUrl + '/study/getTraclass',
      method: 'POST',
      data: {
        openid: that.data.openid,
        userId: that.data.userId,
      },
      success: function(res){
        that.setData({
          list: res.data.data
        })
      }
    })
  },
  /**
   * 去学习页面
   */
  tolearn: function(e){
    wx.navigateTo({
      url: '/pages/learn/learn?orderUserId=' + e.target.dataset.id + '&traId=' + e.target.dataset.traid
    })
  }
})