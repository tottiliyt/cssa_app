// pages/restaurant/details.js
import {
  logger
} from "../../app/core-functions.js";
import {
  getRestaurants,
  getUserLocation,
  appendDistance,
  sortArray
} from "../../app/restaurant-actions.js";


Page({

  /**
   * Page initial data
   */
  data: {
    imgDomain: getApp().globalData.imgDomain,
    xuelianka: "https://api.jhucssa.com/api/img/xlk19.png",
    iconHome: getApp().globalData.iconHome,
    iconForward: getApp().globalData.iconForward

  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    logger("restaurant", "detail-loaded", options.id);

    this.setData({
      id: options.id
    });


 

    let thisPage = this

    getRestaurants(options.id).then(
      res => {
        thisPage.setData({
          item: res.data[0]
        });
        thisPage.appendUserDistance(false);
      }
    );

    if (options.restaurant) {
      this.setData({ item: JSON.parse(options.restaurant) });
    }
  },

  appendUserDistance: function (strict) {
    let thisPage = this;
    getUserLocation(strict).then(

      res => {
        console.log(res)
        thisPage.setData({
          item: appendDistance([thisPage.data.item], res)[0]
        });
      }

    )
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function () {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow: function () {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide: function () {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function () {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh: function () {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom: function () {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage: function () {
      let id = this.data.id
      logger("restaurant", "share", id);

    let sharePath = `pages/restaurant/details?id=${id}`


    return {
      title: "【CSSA专属折扣】" + this.data.item.name,
      imageUrl: 'https://cloud-minapp-24046.cloud.ifanrusercontent.com/'+id+'.png',
      path: sharePath
    }
    
  },

  onShareTimeline: ()=>{
    let id = this.data.id
      logger("restaurant", "share", id);
    return {
      title: "【CSSA专属折扣】" + this.data.item.name,
    }

  },



  goBack: function(){
    wx.switchTab({
      url: 'restaurant',
    })
  },

  goToCard: function () {
    let id = this.data.id
    wx.navigateTo({
      url: `../card/card?id=${id}`,
    })
  },

  goToPhoneCall: function(){
    let thisPage = this
    logger("restaurant", "phone-call", this.data.id);
    wx.makePhoneCall({
      phoneNumber: thisPage.data.item.phone
    })
  },

  goToMap: function(){
    let thisPage = this
    logger("restaurant", "go-to-map", this.data.id);
    wx.openLocation({
      latitude: parseFloat(thisPage.data.item.longlat.split(",")[0]),
      longitude: parseFloat(thisPage.data.item.longlat.split(",")[1]),
      name: thisPage.data.item.name,
      address: thisPage.data.item.address
    })
  }
})