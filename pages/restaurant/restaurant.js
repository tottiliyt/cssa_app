import {
  baasLogin,
  getEvents,
  logger
  
} from "../../app/core-functions.js";
import {
  getRestaurants,
  getUserLocation,
  appendDistance,
  sortArray,
  countTags
} from "../../app/restaurant-actions.js";

let searchQuery = ""

Page({

    data: {
      imgUrls: wx.getStorageSync("restaurantSlides") || [],
      indicatorDots: false,
      autoplay: true,
      interval: 7000,
      duration: 700,


      imgDomain: "https://api.jhucssa.com/api/img/",
      xuelianka: "https://api.jhucssa.com/api/img/xlk19.png",
      url: "https://api.jhucssa.com/restaurants?id="+getApp().globalData.ifanrID,
      tags: wx.getStorageSync("restaurantTags") || [],
      restaurants: wx.getStorageSync("restaurants") || [],
      restaurantsFull: wx.getStorageSync("restaurants") || [],
      currentPickerValue: wx.getStorageSync("restaurantPicker") || 0,
      currentSortOption: wx.getStorageSync("restaurantSort") || 'id',
      openFilter: false,
      sortOptions: [
        {
          value: 'id',
          name: '默认排序'
        },
        {
          value: 'name',
          name: '商家名称'
        },
        {
          value: 'distance',
          name: '商家距离'
        }
      ],
    },


    onLoad: function(_options) {
      let thisPage = this;
      this.getEvents()
      getRestaurants().then(

        res => {
        
          let tags = countTags(res.data);

          thisPage.setData({
            restaurants: res.data,
            restaurantsFull: res.data,
            tags: tags
          });
          wx.setStorageSync("restaurants", res.data);
          wx.setStorageSync("restaurantTags", tags);
          thisPage.appendUserDistance(true)

        },
        _err => {
          showError();
        }
      );
    },





    onReady: function() {},


    onShow: function() {},


    onHide: function() {},


    onUnload: function() {},


    onPullDownRefresh: function() {

      this.appendUserDistance(false)
    },


    onReachBottom: function() {},


    onShareAppMessage: getApp().onShareAppMessage,

    onShareTimeline: getApp().onShareAppMessage,

    goToCard: function(){
      wx.navigateTo({
        url: '../card/card',
      })
    },

    goToDetails: function(e){
      let thisPage = this;
      wx.navigateTo({
        url: 'details?id=' + e.currentTarget.dataset.id + '&restaurant=' + JSON.stringify(thisPage.data.restaurants[e.currentTarget.dataset.idx]),
      })
    },

    appendUserDistance: function(strict){
      let thisPage = this;
      getUserLocation(strict).then(

        res => {
          console.log(res)
          thisPage.setData({
            restaurants: appendDistance(thisPage.data.restaurants, res),
            restaurantsFull: appendDistance(thisPage.data.restaurantsFull, res)
          });
          thisPage.sortArray()
        }

      )
    },

    sortArray: function(){
      let thisPage = this;
      thisPage.setData({
        restaurants: sortArray(thisPage.data.restaurants, thisPage.data.currentSortOption),
        restaurantsFull: sortArray(thisPage.data.restaurantsFull, thisPage.data.currentSortOption)
      });

    },

    bindPickerChange: function (e) {
      let thisPage = this;
      let value = thisPage.data.sortOptions[e.detail.value].value;
      console.log('picker发送选择改变，携带值为', thisPage.data.sortOptions[e.detail.value])
      this.setData({
        currentSortOption: value,
        currentPickerValue: e.detail.value
      })
      wx.setStorageSync("restaurantSort", value)
      wx.setStorageSync("restaurantPicker", e.detail.value)

      logger("restaurant", "order-switched", value);

      this.sortArray()
      value == 'distance' ? this.appendUserDistance(true) : null;

    },

    toggleFiler: function(){
      logger("restaurant", "filter-toggled", searchQuery);
      this.setData({
        openFilter: !this.data.openFilter,
        query:""
      })
      searchQuery=""
      this.search();
    },

    bindSearch(e) {
      searchQuery = e.detail.value
      this.setData({ query: searchQuery });
      this.search();
    },

    bindTag: function (e) {
      searchQuery = e.currentTarget.dataset.value
      logger("restaurant", "tag-toggled", searchQuery);
      this.setData({
        query: searchQuery
      })
      this.search();
    },

    search: function(){
      let res = this.data.query ? this.data.restaurantsFull.filter(filterArray) : this.data.restaurantsFull;
      this.setData({
        restaurants: res
      })
      
    },


    getEvents: function() {
        const thisPage = this;
        
        getEvents(5).then(
            res => {
                thisPage.setData({ imgUrls: res.data });
                wx.setStorageSync("restaurantSlides", this.data.imgUrls);

            },
            _err => {

            }
        );

    },



    bindWeb: function (e) {
      const { url } = e.currentTarget.dataset;
      console.log(url);

      if (url.includes("http")) {
        this.goToWeb(url)
      } else {
        wx.navigateTo({
          url: url,
        })
      }
    },

    goToWeb: function (url, encoded) {
      let urlEncoded = encoded ? url : encodeURIComponent(url)
      wx.navigateTo({ url: `/pages/web/web?url=${urlEncoded}` });
    },

    goToSuggestion: function(){
      this.goToWeb("https://api.jhucssa.com/restaurants/suggestion/");
    }
});


function filterArray(item){
  let text = JSON.stringify(item)
  return text.indexOf(searchQuery.toLocaleLowerCase())!=-1;

}