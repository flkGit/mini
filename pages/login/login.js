const app = getApp()
const utils = app.utils

Page({

  /**
   * 页面的初始数据
   */
  data: {
    tel: '', // 用户名
    password: '', // 密码
    code: '', // 图片验证码
    imgCode: null,
    disabled: false, // 按钮是否禁用
    loading: false, // 是否显示登录中状态
    openid: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getOpenid()
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
    // this.getCodeImg()
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
   * 获取缓存中的openid
   */
  getOpenid: function(){
    let that = this
    wx.getStorage({
      key: 'openid',
      success: function (res) {
        that.data.openid = res.data
        that.getCodeImg();
      },
      fail: function (res) {
        that.getOpenid()
      }
    })
  },
  /**
   * 手机号输入框失去光标事件
   */
  telBlur: function(e){
    let that = this
    if(e.detail.value){
      that.setData({
        tel: e.detail.value
      })
    }
  },
  /**
   * 密码输入框失去光标事件
   */
  passwordBlur: function (e) {
    let that = this
    if (e.detail.value) {
      that.setData({
        password: e.detail.value
      })
    }
  },
  /**
   * 图片验证码输入框失去光标事件
   */
  codeBlur: function (e) {
    let that = this
    if (e.detail.value) {
      that.setData({
        code: e.detail.value
      })
    }
  },
  /**
   * 获取图片验证码
   */
  getCodeImg: function(){
    let that = this
    that.setData({
      imgCode: app.globalData.apiUrl + '/user/getCode?openid=' + that.data.openid + '&t=' + Math.random()
    })
  },
  /**
   * 提交表单
   */
  submit: function(){
    let that = this;
    // that.toTrainList()
    that.setData({
      disabled: true, // 按钮是否禁用
      loading: true, // 是否显示登录中状态
    })
    wx.request({
      url: app.globalData.apiUrl + '/user/bind', //仅为示例，并非真实的接口地址
      method: 'POST',
      data: {
        openid: that.data.openid,
        usertype: 1,
        username: that.data.tel,
        password: that.data.password,
        code: that.data.code
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function (res) {
        that.setData({
          disabled: false, // 按钮是否禁用
          loading: false, // 是否显示登录中状态
        })
        if(res.data.status == 200){
          // 登录成功
          wx.setStorage({
            key: 'userId',
            data: res.data.data.userId,
          })
          that.toTrainList()
        }else{
          // 登录失败
          that.getCodeImg()
          wx.showToast({
            title: res.data.error,
            icon: 'none',
            duration: 1500
          })
        }
      }
    })
  },
  /**
   * 去培训班列表页面
   */
  toTrainList: function(data){
    wx.navigateTo({
      url: '/pages/trainList/trainList'
    })
  }
})