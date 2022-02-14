// pages/card/card.js
var imgUrl = "https://cloud-minapp-24046.cloud.ifanrusercontent.com/card-back.png"
var app = getApp()
// pages/restaurant/details.js
import {
  logger,
  checkIsLoggedIn
} from "../../app/core-functions.js";
import {
  getRestaurants,
  getUserLocation,
  appendDistance,
  sortArray,
  activateMembership,
  checkMembership
} from "../../app/restaurant-actions.js";

const moment = require('../../utils/moment.min.js');

Page({
  data: {
    cardStyle: "",
    cardRotation: "",
    logo: app.globalData.imgDomain + "logo_grey.png",
    loaded: false,
    restaurantAll:  [],
    confirmationText: "数据载入中...",
    authed: wx.getStorageSync("authed"),
    ordernum: wx.getStorageSync("card_ordernum"),
    email: wx.getStorageSync("card_email")
  },


  onLoad: function (options) {
    wx.showLoading({
      title: "请求授权中...",
    })
    let that = this

    checkMembership().then(
      res => {
        that.setData({
          authed: true
        })
        wx.setStorageSync("authed", true)
      },
      err =>{
        
        if (!that.data.authed || that.data.authed!=true){
          logger("card", "card-not-membership", err);
          that.setData({
            authed: false
          })
        }else{
          console.log("NOT MEMBER!")
          logger("card", "card-checkmembership-error-true-but-unauthed", err);
        }
    });


    logger("card", "card-loaded", null);
    this.updateReflection(100, 0)
    wx.startAccelerometer({interval: "game"})
    wx.onAccelerometerChange(function (res) {
      let xdeg = res.x;
      let ydeg = res.y;
      that.updateReflection(ydeg * 180, xdeg * 100)
      that.setData({ 
        cardRotation: `transform: rotateX(${ydeg * 10}deg) rotateY(${-xdeg * 30}deg);`
       })
    })

    //wx.navigateBack({});

    console.log(app.globalData.baasInfo);

    if (!app.globalData.ucl) {
      app.getUcl();
    }

    app.uclReadyCallback = _res => {
      this.setData({ ucl: app.globalData.ucl });
    };

    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        loaded: true
      });
      wx.hideLoading()
    } else {
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          ucl: app.globalData.ucl,
          loaded: true
        });
        //baasLogin(res);
        wx.hideLoading()
      };

        checkIsLoggedIn().then(
          res => {
            if(res==false){
              wx.switchTab({
                url: '/pages/restaurant/restaurant',
              })
              logger("card", "card-not-logged-in", null);
              wx.showModal({
                title: "JHUCSSA学联卡",
                content: "您必须要先登录才能使用电子版学联卡，现在就登录？",
                success(res) {
                  if (res.confirm) {
                    wx.switchTab({
                      url: "/pages/me/me"
                    });
                  }
                }
              });
              wx.hideLoading()
            }
          });
      
    }
    this.setData({ ucl: app.globalData.ucl });
    
      getRestaurants().then(
        res => {

          getUserLocation((that.data.userInfo) ? true : false).then(
            res2 => {
              console.log(res)
              that.setData({
                restaurantAll: sortArray(appendDistance(res.data, res2), 'distance')
              });
              if (options.id) {
                that.setData({
                  id: options.id,
                  restaurant: that.data.restaurantAll.find(x => x.id === options.id)
                });

              } else {
                that.setData({
                  restaurant: that.data.restaurantAll[0]
                });
              }

            
              that.checkFeedBackSystem()
              // wx.setStorageSync("cardRestaurants", that.data.restaurantAll)
              // wx.showToast({
              //   title: '请向店员出示此页面',
              //   icon: 'none'
              // })
            },
            err => {
              that.setNoLocation()

            }

          )

        }
      );




    setInterval(()=>{
      that.setData({
        date: moment().format('YYYY-MM-DD dddd'),
        time: moment().format('HH:mm:ss')
      })
    },1000)



  },

  onUnload: function () {
    logger("card", "card-exited", null);
    wx.stopAccelerometer()
    //this.goToWeb("https://api.jhucssa.com/restaurants/card-landing/");


  },

  checkFeedBackSystem: function(){
    let that = this
    //check if restaurant is near by, and activate feedback functions
    if (that.data.restaurant.distance < 5) {
      that.setData({
        showConfirmation: true,
        confirmationText: "您是否能够成功使用学联卡并获得相应折扣？"
      })
      logger("card", "card-feedback-showed", that.data.restaurant.id);
    } else {
      that.setData({
        showConfirmation: false,
        confirmationText: `此商家距离您过远（${that.data.restaurant.distance} km）`
      })
      logger("card", "card-feedback-showed-too-far", that.data.restaurant.id);
    }
  },

  setNoLocation: function(){
    this.setData({
      restaurant: { name: "无法获取商家信息", discount: "请检查您的位置权限设置", id: -1 },
      confirmationText: "电子版学联卡需要您的位置权限信息才能正常使用"
    });
  },



  goToWeb: function (url, encoded) {
    let urlEncoded = encoded ? url : encodeURIComponent(url)
    wx.navigateTo({ url: `/pages/web/web?url=${urlEncoded}` });
  },

  updateReflection: function (degree, percentage){
    this.setData({
      cardStyle: `background:linear-gradient(${degree}deg, 
                  rgba(255,255,255,0) 0%,rgba(255,255,255,0.4) ${percentage}%,
                  rgba(255,255,255,0) 100%), url('${imgUrl}');
                  background-size: cover;`
    })
  },

  bindChange:function(){
    logger("card", "card-change-restaurant", this.data.restaurant.id);
    let list = this.data.restaurantAll.slice(0, 5).map(a => `${a.name} - ${a.distance} km`)
    list.push("返回商家列表")
    let that = this;
    wx.showActionSheet({
      itemList: list,
      success: function (tap) {
        console.log(list[tap.tapIndex]);
        logger("card", "card-restaurant-changed", list[tap.tapIndex]);
        if (tap.tapIndex==5){
          wx.switchTab({
            url: '/pages/restaurant/restaurant',
          })
        }else{
          that.setData({
            restaurant: that.data.restaurantAll[tap.tapIndex],
            id: that.data.restaurantAll[tap.tapIndex].id
          })
          that.checkFeedBackSystem()
        }
      }
    })
  },

  bindYesFeedback:function(){
    logger("card", "card-feedback-yes", this.data.restaurant.id);
    this.setData({
      showConfirmation: false,
      confirmationText: "感谢您的反馈！"
    })
  },

  bindNoFeedback:function(){
    logger("card", "card-feedback-no", this.data.restaurant.id);
    let list = ['商家不接受任何形式的学联卡', '商家不接受电子版学联卡', '商家拒绝提供折扣', '商家只能提供有限的折扣', '其他原因']
    let that = this;
    wx.showActionSheet({
      itemList: list,
      success: function (tap) {  
        console.log(list[tap.tapIndex]);
        logger("card", "card-feedback-reason", list[tap.tapIndex]);
        that.setData({
          showConfirmation: false,
          confirmationText: "感谢您的反馈！"
        })
      },
      fail: function (err) {
        logger("card", "card-feedback-no-canceled", that.data.restaurant.id);
        console.log(err.errMsg)
      }
    })

  },

  bindActivate: function () {
    if (!this.data.ordernum || !this.data.email){
      return
    }
    wx.setStorageSync("card_ordernum", this.data.ordernum)
    wx.setStorageSync("card_email", this.data.email)
    wx.showLoading({
      title: '正在请求中...',
    })

    let that = this
    activateMembership(this.data.ordernum, this.data.email).then(
      res => {
        wx.hideLoading()
        that.setData({
          authed: null
        })
        wx.showModal({
          title: '激活成功',
          content: '感谢您对学联的支持，您已成功激活电子版学联卡！',
          showCancel: false,
          success: function (res) {
            that.setData({
              authed: true
            })
          }
        })
        
        
      },
      err => {
        wx.hideLoading()
        wx.showModal({
          title: '激活失败',
          content: err == 'already_added' ? '很抱歉，此订单号已经被注册。若有任何疑问，请联系客服。' : '我们暂时无法找到此订单号及邮箱组合，若您刚完成购买，系统可能暂时还未人工更新，请稍等几天后再次尝试。您也可以检查您的邮箱或订单号再试一遍。若仍无法注册，请联系客服。',
          showCancel: false
        })
      });
  },

  bindBuy: function () {
    wx.setClipboardData({
      data: 'http://studentsunionucl.org/clubs-societies/chinese-students-and-scholars-association',
      success: function (_res) {
        wx.showModal({
          title: 'Union官网网址已复制',
          content: '由于微信限制，您可以粘贴此网址在浏览器内打开。',
          showCancel: false
        })
      }
    });
  },

  bindExample: function () {
    wx.previewImage({
      current: "https://cloud-minapp-24046.cloud.ifanrusercontent.com/1idw5m1hjGzE89Ok.png",
      urls: ["https://cloud-minapp-24046.cloud.ifanrusercontent.com/1idw5m1hjGzE89Ok.png","https://cloud-minapp-24046.cloud.ifanrusercontent.com/1idw5qNLiwy7DNIy.png"]
    });
  },

  bindProfile: function () {
    wx.navigateTo({ url: `/pages/web/web?url=https%3A%2F%2Fapi.jhucssa.com%2Fpost%2Fprofile.php%3Fremoteid%3D%23%23ifanrid%23%23%26id%3D%23%23ifanrid%23%23` });
  },

  bindEnterOrder(e) {
    this.setData({ ordernum: e.detail.value });
  },

  bindEnterEmail(e) {
    this.setData({ email: e.detail.value });
  },


})

/*  src: https://github.com/henryzhang00/Canvas-Play-Around/tree/master/tilting-3d-card   */

