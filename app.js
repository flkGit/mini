//app.js

App({
  globalData: {
    apiUrl: 'https://mini.api.chinafhse.org',
    openid:''
  },
  onLaunch: function () {
    let that = this
    wx.getStorage({
      key: 'openid',
      success: function(res) {
        that.getUserId(res.data)
      },
      fail: function(){
        wx.login({
          success: res => {
            // 发送 res.code 到后台换取 openId, sessionKey, unionId
            wx.request({
              url: that.globalData.apiUrl + '/api/wxuser',
              method: 'POST',
              data: {
                code: res.code
              },
              success: res => {
                that.globalData.openid = res.data.data.openid;
                wx.setStorage({
                  key: 'openid',
                  data: res.data.data.openid,
                })
                that.getUserId(res.data.data.openid)
              }
            })
          }
        })
      }
    })
  },
  getUserId: function(openid){
    let that = this
    wx.request({
      url: that.globalData.apiUrl + '/user/getUserId',
      method: 'POST',
      data: {
        openid: openid,
        usertype: 1
      },
      success: function (res) {
        if(res.data.data.userId){
          wx.setStorage({
            key: 'userId',
            data: res.data.data.userId,
          })
        }
      }
    })
  }
})