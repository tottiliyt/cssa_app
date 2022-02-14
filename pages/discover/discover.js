const app = getApp();

import {
    hideAll,
    showError,
    updateUserInfo,
} from "../../app/common-functions.js";

import {
  getEvents
} from "../../app/core-functions.js";
import { getFeeds, getSpaces, getPostOptions } from "../../app/feed-actions.js";

const initialOptions = [{name:"动态",color:"gradient1",space:0},
                        {name:"闲置",color:"gradient5",space:4},
                        {name:"问题",color:"gradient6",space:2},
                        {name:"租房",color:"gradient4",space:3},
                        {name:"更多",color:"gradient2",space:0},]

Page({
    data: {
        eventUrls: wx.getStorageSync("cssaevents") || [],
        imgTimetable: app.globalData.imgDomain + "qr.jpg",
        imgComment: app.globalData.imgDomain + "icon-comment.png",
        imgPlus: app.globalData.imgDomain + "icon-plus.png",
        addto: app.globalData.imgDomain + "add-to-mine.png",
        showedaddto: wx.getStorageSync("showedadd"),
        navTab: wx.getStorageSync("navs") || [],
        navTabNumber: wx.getStorageSync("navs-num") || 8,
        currentNavtab: "0",
        currentSpace: 0,
        currentSpaceName: "默认",
        feeds: wx.getStorageSync("feeds") || [],
        feed_length: 0,
        avatar: app.globalData.imgDomain + "profile.jpg",
        imgCam: app.globalData.imgDomain + "icon-camera.png",
        currentStartPost: -1,
        currentEndPost: -1,
        loading: true,
        ifanrID: -1,
        userInfo: app.globalData.userInfo,
        publish_options:false,
        options: wx.getStorageSync("postOptions") || initialOptions,
        maintenance: false
    },

    onShow: function() {
        if (app.globalData.notice) {
            this.setData({ notice: app.globalData.notice });
        }

        if (!this.data.userInfo || app.globalData.needUpdate) {
            updateUserInfo(this);
            app.globalData.needUpdate = false;
        }

        if (app.globalData.needFeedRefresh) {
            this.getFeeds();
            app.globalData.needFeedRefresh = false;
        }
    },

    onShareAppMessage: getApp().onShareAppMessage,

    onShareTimeline: getApp().onShareAppMessage,

    onLoad: function(_options) {
        wx.showToast({
            title: "加载中...",
            icon: "loading",
            mask: true,
            duration: 5000
        });
        updateUserInfo(this);
 
        //等待app.js登陆成功，callback设置当前用户的userinfo和头像
        app.userInfoReadyCallback = _res => {
            updateUserInfo(this);
        };

        if (getApp().globalData.isAdmin) {
          this.setData({
            isAdmin: getApp().globalData.isAdmin
          })
        }

        this.setData({ ifanrID: app.globalData.ifanrID });
        this.getFeeds();
        this.getSpaces();
        this.getEvents();
        this.getPostOptions();
    },

    onHide: function(){
      this.hidePublishOptions();
    },

    goToWeb: function(url, encoded){
      let urlEncoded = encoded ? url : encodeURIComponent(url)
      wx.navigateTo({ url: `/pages/web/web?url=${urlEncoded}` });
    },

    goToProfile: function(e) {
      wx.navigateTo({ url: `/pages/web/web?url=https%3A%2F%2Fapi.jhucssa.com%2Fpost%2Fprofile.php%3Fremoteid%3D${e.currentTarget.dataset.id}%26id%3D%23%23ifanrid%23%23` });
    },

    pleaseLogin: function() {
        wx.showModal({
            title: "提示",
            content: "您必须要登录才能够发布动态，现在就登录？",
            success(res) {
                if (res.confirm) {
                    wx.switchTab({ url: "/pages/me/me" });
                }
            }
        });
    },

    onPullDownRefresh: function() {
        //下拉刷新
        if (this.data.navTab.length === 0) {
            this.getSpaces();
        }

        this.getFeeds();
        updateUserInfo(this);
        this.hidePublishOptions();
    },

    onReachBottom: function() {
        let feeds = this.data.feeds
        if (feeds && !this.data.loading) {
            console.log("Reached Bottom, Refreshing...");

          let lastPostUpdated = feeds[feeds.length-1].updated_at;
          this.getFeeds(true, lastPostUpdated);
        }
    },

    hideAdd: function() {
        //hide "add to my mini programs" banner
        wx.setStorageSync("showedadd", true);
        this.setData({ showedaddto: true });
    },

    goToPublish: function(spaceId) {
        this.hidePublishOptions();
        let currentNav = isNaN(spaceId) ? this.data.currentNavtab : spaceId
        console.log(currentNav)
        wx.navigateTo({
            url:
                "../publish/publish" +
                `?space_id=${this.data.currentSpace}` 
                // `&current_nav=${currentNav}`
                // `&space_array=${JSON.stringify(this.data.navTab)}` +
        });
    },

    switchTab: function(e) {
        wx.showLoading({
            title: "加载中...",
            mask: true,
            duration: 5000
        });
        this.setData({
            currentNavtab: e.currentTarget.dataset.idx,
            currentSpace: e.currentTarget.dataset.space,
            currentSpaceName: e.currentTarget.dataset.name
        });
        this.getFeeds();
        this.hidePublishOptions();
    },
    

    //Get feed from the server by parsing json
    getFeeds: function(concat, afterDate) {
        this.setData({ loading: true });
        wx.showNavigationBarLoading();

        const thisPage = this;

        getFeeds(
            thisPage.data.ifanrID,
            afterDate,
            null,
            this.data.currentSpace
        ).then(
            res => {
                //concat post to existing ones if true
                console.log(concat);
                if (concat) {
                    const feedTemp = thisPage.data.feeds;
                    thisPage.setData({
                        feeds: feedTemp.concat(res.posts),
                        loading: false
                    });
                } else {
                    thisPage.setData({
                        feeds: res.posts,
                        loading: false
                    });
                }

                //save to cache for faster loading next time
                wx.setStorageSync("feeds", this.data.feeds);
                hideAll(this);

                //alert user if it reaches end and terminate
                if (!res.posts[0]) {
                    wx.showToast({
                        title: "没有更多了",
                        icon: "none",
                        duration: 3000
                    });
                    return;
                }

                //set new first post id and last post id
                if (thisPage.data.currentStartPost < res.posts[0].post_id) {
                    thisPage.data.currentStartPost = res.posts[0].post_id;
                }
                thisPage.data.currentEndPost =
                    res.posts[res.posts.length - 1].post_id;

                //TODO: change to logger later
                console.log(
                    `get-feeds-success: [` +
                        `start: ${thisPage.data.currentStartPost}, ` +
                        `end: ${thisPage.data.currentEndPost}` +
                        `]`
                );
            },
            _err => {
                hideAll(this);
                showError();
            }
        );
    },

    getSpaces: function() {
        wx.showNavigationBarLoading();
        const thisPage = this;

        getSpaces().then(
            res => {
                thisPage.setData({
                    navTab: [{ name: "全部动态", id: 0 }].concat(res.data),
                    navTabNumber: res.data.length + 1
                });
                wx.setStorageSync("navs", this.data.navTab);
                wx.setStorageSync("navs-num", this.data.navTabNumber);
                hideAll(this);
            },
            _err => {
                showError();
                hideAll(this);
            }
        );
    },
    
    getPostOptions: function() {
        wx.showNavigationBarLoading();
        const thisPage = this;

        getPostOptions().then(
            
            res => {
              console.log(res.data)
              let json = res.data
                
                thisPage.setData({
                    options: json
                });
                wx.setStorageSync("postOptions", json);
                hideAll(this);
            },
            _err => {
                showError();
                hideAll(this);
            }
        );
    },

    goToDetails: function(e) {
        this.hidePublishOptions();
        const postid = e.currentTarget.dataset.id;
        const url = e.currentTarget.dataset.url;

        if(url){
          this.goToWeb(url)
          
        }else{
          wx.navigateTo({
              url:
                  `../moments/detail` +
                  `?id=${postid}` +
                  `&post=${JSON.stringify(
                      this.data.feeds[e.currentTarget.dataset.idx]
                  )}`
          });
        }
    },

    toClipboard: function(e) {

        if(this.data.isAdmin){


          wx.navigateTo({
            url:
              `../moments/detail` +
              `?id=${e.currentTarget.dataset.id}` +
              `&post=${JSON.stringify(
                this.data.feeds[e.currentTarget.dataset.idx]
              )}`
          });

          wx.showToast({
            title: "已使用管理员权限进入本贴",
            icon: "none",
            duration: 3000
          });
          
        }else{
          wx.setClipboardData({
            data: e.currentTarget.dataset.content,
            success: function (_res) {
              wx.showToast({
                title: "复制成功",
                icon: "success",
                duration: 1000
              });
            }
          });
        }
    },

    goToImage: function(e) {
        const { url } = e.currentTarget.dataset;
        const urlSet = e.currentTarget.dataset.arr;
        console.log(urlSet);
        wx.previewImage({
            current: url,
            urls: urlSet
        });
    },

    showPublishOptions: function(){
      this.setData({
        publish_options: true
      })
    },

    hidePublishOptions: function(){
      this.setData({
        publish_options: false
      })
    },

    goToPublishWithSpace: function(e){
      this.goToPublish(e.currentTarget.dataset.space)
    },


  getEvents: function () {
    const thisPage = this;

    getEvents(3).then(
      res => {
        thisPage.setData({ eventUrls: res.data });
        wx.setStorageSync("cssaevents", this.data.eventUrls);
      },
      _err => {
        showError();
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
});
