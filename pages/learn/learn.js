//index.js
//获取应用实例
const app = getApp()
const polyv = require('../../utils/polyv.js');

Page({
  data: {
    openid: null,
    userId: null,
    list: null,
    vid: null,
    cid: null,
    traId: null,
    orderUserId: null,
    videoSrc: null, // 视频的路径
    isValidFace: true, // 是否需要检查人脸识别
    isCamera: false, // 是否开启摄像头
    timer: null, // 开始人脸识别之后的setInterval
    currentTime: 0, // 视频播放的时长
    playTime: 0, // 视频正常播放时长
    playTimer: null, // 视频正常播放计时器
    fullScreen: false, // 视频是否全屏
    backFullScreen: false, // 是否回到全屏
    time: 0, // 视频已观看的时间
    validTime: 0, // 多长时间重新人脸识别
    validTimer: null, // 多长时间重新人脸识别控制器
    imgSrc: null, // 人脸识别base64
    isPostData: false, // 是否需要同步数据
    i: 0, // 控制检查速率
  },
  onReady: function () {
    let that = this
    that.videoContext = wx.createVideoContext('polyvVideo')
  },
  onLoad: function (options) {
    let that = this
    that.ctx = wx.createCameraContext()
    wx.getStorage({
      key: 'openid',
      success: function (res) {
        that.data.openid = res.data
        wx.getStorage({
          key: 'userId',
          success: function (res) {
            that.setData({
              userId: res.data,
              traId: options.traId,
              orderUserId: options.orderUserId
            })
            that.getTrainInfo(options.orderUserId, true);
          },
        })
      },
    })
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function (options) {

  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    let that = this
    that.updateStudyLog(that.data.cid, that.data.currentTime)
    try {
      polyv.destroy();
    } catch (e) {

    }

  },
  /**
   * 切换视频
   */
  changeCourse: function (e) {
    let that = this;

    let cid = e.currentTarget.dataset.cid
    let vid = e.currentTarget.dataset.vid
    let time = e.currentTarget.dataset.time
    let pcid = that.data.cid
    let ptime = that.data.currentTime
    if (cid == pcid) {
      return false;
    } else {
      that.setData({
        isValidFace: true
      })
      // 需要同步上一个视频进度
      that.updateStudyLog(pcid, ptime)
      that.initPlayer(cid, vid, time)
    }
  },
  /**
   * 获取培训班的课程信息
   */
  getTrainInfo: function (orderUserId, isInit) {
    let that = this
    wx.request({
      url: app.globalData.apiUrl + '/study/getCourse',
      method: 'POST',
      data: {
        openid: that.data.openid,
        userId: that.data.userId,
        oderUserId: orderUserId
      },
      success: function (res) {
        that.setData({
          list: res.data.data
        })

        if (isInit) {
          let vid = res.data.data[0].list[0].vid
          let cid = res.data.data[0].list[0].cid
          let time = res.data.data[0].list[0].time

          that.initPlayer(cid, vid, time)
        }
      },
    })
  },
  /**
   * 检测是否需要人脸识别
   */
  validFace: function () {
    let that = this
    wx.request({
      url: app.globalData.apiUrl + '/study/validFace',
      method: 'POST',
      data: {
        openid: that.data.openid,
        userId: that.data.userId,
        traId: that.data.traId,
        cid: that.data.cid ? that.data.cid : 0
      },
      success: function (res) {
        if (res.data.status == 200) {
          that.videoContext.pause()
          if (that.data.fullScreen) {
            that.setData({
              backFullScreen: true
            })
            that.videoContext.exitFullScreen();
          }
          if (res.data.data.type == 1) {
            wx.showToast({
              title: '请上传免冠照',
              icon: 'none',
              duration: 1500
            })
            wx.chooseImage({
              count: 1, // 默认9
              sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
              sourceType: ['album'], // 可以指定来源是相册还是相机，默认二者都有
              success: function (res) {
                // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
                var tempFilePaths = res.tempFilePaths
                wx.uploadFile({
                  url: app.globalData.apiUrl + '/study/uploadFacePhoto', //仅为示例，非真实的接口地址
                  filePath: tempFilePaths[0],
                  name: 'file',
                  formData: {
                    openid: that.data.openid,
                    userId: that.data.userId,
                  },
                  success: function (res) {
                    var data = JSON.parse(res.data)
                    if (data.status == 200) {
                      wx.showToast({
                        title: data.data,
                        icon: 'none',
                        duration: 1500
                      })
                    } else {
                      wx.showToast({
                        title: data.error,
                        icon: 'none',
                        duration: 2000
                      })
                      that.validFace();
                    }
                  }
                })
              }
            })
          } else {
            that.setData({
              isCamera: true,
              isPostData: true,
              validTime: res.data.data.time
            })
            that.cameraUpload();
          }
        } else {
          that.setData({
            isPostData: false,
            isValidFace: false,
            isCamera: false
          })
          that.playInit();
        }
      }
    })
  },
  /**
   * 初始化播放
   */
  initPlayer: function (cid, vid, time) {
    let that = this
    // 删除计时器
    that.clearTimer();

    that.setData({
      vid: vid,
      cid: cid,
      time: time,
      currentTime: time,
      playTime: time,
    })

    let vidObj = {
      vid: vid,
      callback: function (videoInfo) {
        that.setData({
          videoSrc: videoInfo.src[0]
        })
        // 设置视频开始播放进度
        // that.videoContext.seek(time);
      }
    }
    polyv.getVideo(vidObj);
  },
  /**
   * 删除计时器，切换视频，视频暂停，视频播放重启计时器
   */
  clearTimer: function () {
    let that = this;
    clearInterval(that.data.playTimer);
    that.setData({
      currentTime: 0
    })
  },
  /**
   * 获取播放时长
   */
  timeUpdate: function (e) {
    let that = this;
    if (e.detail.currentTime > that.data.playTime) {
      that.videoContext.seek(that.data.playTime)
    } else {
      that.setData({
        currentTime: that.data.playTime
      })
      // polyv.timeUpdate(e);
    }
  },
  /**
   * 上传播放记录
   */
  updateStudyLog: function (cid, time) {
    let that = this
    wx.request({
      url: app.globalData.apiUrl + '/study/updateStudyLog',
      method: 'POST',
      data: {
        openid: that.data.openid,
        userId: that.data.userId,
        traId: that.data.traId,
        oderUserId: that.data.orderUserId,
        cid: cid,
        time: time
      },
      success: function (res) {
        if (res.data.status == 200) {
          that.getTrainInfo(that.data.orderUserId, false);
          that.setHnRecordData(cid, time)
        }
      }
    })
  },
  /**
   * 同步播放记录
   */
  setHnRecordData: function (cid) {
    let that = this
    if (!that.data.isPostData) {
      return;
    }
    wx.request({
      url: app.globalData.apiUrl + '/study/setHnRecordData',
      method: 'POST',
      data: {
        openid: that.data.openid,
        userId: that.data.userId,
        traId: that.data.traId,
        cid: cid,
        faceData: that.data.imgSrc
      },
      success: function (res) {
        console.log(res.data)
      }
    })
  },
  /**
   * 人脸识别
   */
  takePhoto: function () { // 拍照人脸识别
    let that = this;
    that.ctx.takePhoto({
      quality: 'low',
      success: function (res) {

        wx.uploadFile({
          url: app.globalData.apiUrl + '/study/compareFace', //仅为示例，非真实的接口地址
          filePath: res.tempImagePath,
          name: 'file',
          formData: {
            openid: that.data.openid,
            userId: that.data.userId,
          },
          success: function (res) {
            let data = JSON.parse(res.data);
            if (data.status == 200) {
              that.setData({
                imgSrc: data.data.faceData,
                isCamera: false,
                isValidFace: false
              })
              wx.showToast({
                title: data.data.info,
                icon: 'none',
                duration: 2000
              })
              if (that.data.backFullScreen) {
                that.setData({
                  backFullScreen: false
                })
                that.videoContext.requestFullScreen();
              }
              that.data.validTimer = setTimeout(function () { // 多少秒后重新开始人脸识别
                that.setData({
                  isValidFace: true
                })
                that.playCtrl()
              }, that.data.validTime * 1000)
              that.videoContext.play() //播放视频
            } else {
              that.takePhoto();
              wx.showToast({
                title: data.error,
                icon: 'none',
                duration: 2000
              })
            }
          }
        })
        return;
      }
    })
  },
  /**
   * 视频开始播放
   */
  playCtrl: function () { // 视频开始播放
    let that = this;

    if (that.data.isValidFace) {
      that.validFace()
    } else {
      that.playInit();
    }
  },
  playInit: function () {
    let that = this;
    console.log('play')
    that.clearTimer();
    that.data.playTimer = setInterval(function () {
      that.setData({
        playTime: that.data.playTime + 1
      })
    }, 1000)
  },
  /**
   * 视频暂停，需要同步当前视频进度
   */
  pauseCtrl: function () { // 视频暂停
    let that = this;
    that.updateStudyLog(that.data.cid, that.data.currentTime)
    that.clearTimer();
  },
  /**
   * 切换全屏状态
   */
  screenchange: function (e) { // 切换全屏状态
    let that = this;
    console.log(e.detail.fullScreen);
    that.setData({
      fullScreen: e.detail.fullScreen
    })
  },
  /**
   * 拍照上传
   */
  cameraUpload: function () { // 拍照上传
    let that = this;
    that.videoContext.pause()
    wx.showToast({
      title: '开始人脸识别，请对准摄像头',
      icon: 'none',
      duration: 2000
    })
    setTimeout(function () { // 计时器  每5秒进行一次人脸识别
      that.takePhoto();
    }, 5000)
  },
  /**
   * 用户禁止调用摄像头
   */
  cameraError: function () { // 用户禁止调用摄像头
    wx.showToast({
      title: '无法进行人脸识别，请删除小程序重试',
      icon: 'none',
      duration: 2000
    })
  }
})