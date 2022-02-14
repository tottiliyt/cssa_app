import { baasLogin, getEvents } from "../../app/core-functions.js";
import { showError } from "../../app/common-functions.js";

function sendVerifyEmail(){
    return true;
}

const app = getApp();

Page({
    data: {
        motto: "Welcome to JHUCSSA",
        eventUrls: wx.getStorageSync("myEvents") || [],
        userInfo: {},
        hasUserInfo: false,
        logo: app.globalData.imgDomain + "logo_grey.png",
        ucl_logo: app.globalData.imgDomain + "ucl-logo-offical.jpg",
        showModal: false,
        sent: false,
        imgDomain: "http://api.jhucssa.com/api/img/"
    },
    onLoad: function() {
        console.log(app.globalData.baasInfo);
        if (!app.globalData.ucl) {
            app.getUcl();
        }

        app.uclReadyCallback = _res => {
            wx.hideToast();
            console.log("ucl callback called");
            this.setData({
                ucl: app.globalData.ucl,
                showModal: false
            });
        };

        if (app.globalData.userInfo) {
            this.setData({
                userInfo: app.globalData.userInfo,
                hasUserInfo: true
            });
        } else {
            /*
             * 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
             * 所以此处加入 callback 以防止这种情况
             */
            app.userInfoReadyCallback = res => {
                this.setData({
                    userInfo: res.userInfo,
                    hasUserInfo: true,
                    ucl: app.globalData.ucl
                });
                baasLogin(res);
            };
        }
        this.setData({ ucl: app.globalData.ucl });
        this.getEvents();
    },
    getUserInfo: function() {
        wx.getUserProfile({
            desc: '用于完善您的社区信息',
            success: res => {
        console.log("WHAT")

              app.globalData.userInfo = res.userInfo;
        
              wx.BaaS.auth.updateUserInfo(res, { code: app.globalData.code })
                .then(
        res => {
                  console.log("BaaS update user info successful", res);
              baasLogin();

                },
                err => {
                  console.log("BaaS update user info failed", err);
                }
        );

              app.globalData.needUpdate = true;
            },
          });

        // console.log(e);
        // app.globalData.userInfo = e.detail.userInfo;
        // if (e.detail.userInfo) {
        //     this.setData({
        //         userInfo: e.detail.userInfo,
        //         hasUserInfo: true
        //     });
        //     baasLogin(e);
        //     app.globalData.needUpdate = true;
        //     app.getUcl();
        // } else {
        //     console.log("no login");
        // }
    },

    onShareAppMessage: getApp().onShareAppMessage,

    onShareTimeline: getApp().onShareAppMessage,


    onPageScroll: function(res) {
        // rpx to px: http://www.wxapp-union.com/article-3832-1.html
        const rpx = 200;
        const systemInfo = wx.getSystemInfoSync();
        const px = (rpx / 750) * systemInfo.windowWidth;

        if (res.scrollTop >= px) {
            //开始滚动
            this.setData({ showPlaceholder: true });
        } else {
            this.setData({ showPlaceholder: false });
        }
    },

    //enter email
    bindSearch(e) {
        this.setData({ email: e.detail.value });
    },

    bindWeb: function(e) {
        const { url } = e.currentTarget.dataset;
        console.log(url);

        if(url.includes("http")){
          this.goToWeb(url)
        }else{
          wx.navigateTo({
            url: url,
          })
        }
    },

    // 外面的弹窗
    showBindModal: function() {
        app.getUcl();
        app.uclReadyCallback = _res => {
            console.log("already logged in");
            this.setData({
                ucl: app.globalData.ucl,
                showModal: false
            });
        };
        if (app.globalData.ucl) {
            this.setData({
                ucl: app.globalData.ucl,
                showModal: false
            });
            return;
        }
        this.setData({ showModal: true });
    },

    // 禁止屏幕滚动
    preventTouchMove: function() {},

    // 弹出层里面的弹窗
    ok: function() {
        this.setData({ showModal: false });
    },

    check: function() {
        wx.showToast({
            title: "验证中...",
            icon: "loading",
            duration: 5000
        });
        app.getUcl();
        app.uclReadyCallback = _res => {
            console.log("ucl callback called");
            this.setData({ ucl: app.globalData.ucl });
            wx.showToast({
                title: `绑定成功！ ${
                    this.data.ucl.given_name
                }, 欢迎来到学联社区！`,
                icon: "none",
                duration: 5000
            });
        };
        app.uclNotReadyCallback = _res => {
            console.log("unsuccessful");
            this.setData({ showModal: true });
            wx.showToast({
                title: "验证失败，请检查您的邮箱或者重发一遍？",
                icon: "none",
                duration: 4000
            });
        };
    },

    invokeSend: function() {
        let that = this
        wx.showLoading({ title: "请求中..." });

        sendVerifyEmail(
            getApp().globalData.ifanrID,
            this.data.email,
            this.data.userInfo.nickName
        ).then(
            _res => {
                that.setData({
                  showModal: false,
                  sent: true
                });
                wx.hideLoading();
                wx.showModal({
                  title: '发送成功！',
                  content: '请检查您的邮箱以确认绑定，若未收到请留意查收您的垃圾箱。',
                  showCancel: false
                })
            },
            err => {
                showError(err);
            }
        );
    },

    goToSearch: function() {
        wx.navigateTo({ url: "/pages/ucl/search/search" });
    },
    goToLibrary: function() {
        wx.navigateTo({ url: "/pages/ucl/library/library" });
    },
    goToBooking: function() {
        wx.navigateTo({ url: "/pages/ucl/room/booking" });
    },
    goToMap: function() {
        wx.previewImage({
            urls: [
                "https://www.ucl.ac.uk/maps/downloads/ucl-bloomsbury-campus.jpeg",
                "https://www.ucl.ac.uk/maps/downloads/ucl-central-london.jpeg",
                "https://www.ucl.ac.uk/maps/downloads/royalfree-hampstead-map.jpeg"
            ]
        });
    },
    goToTimetable: function() {
        wx.switchTab({ url: "/pages/timetable/timetable" });
        // this.goToWeb("https://api.jhucssa.com/timetable?id=##ifanrid##")
    },

    goToTfl: function(url) {
        let tflUrl = "https://api.jhucssa.com/api/tfl-status"
        this.goToWeb(tflUrl)
    },

    goToAbout: function(url) {
        let aboutUrl = "https://api.jhucssa.com/about"
        this.goToWeb(aboutUrl)
    },

    goToWeb: function(url){
        wx.navigateTo({ url: `/pages/web/web?url=${encodeURIComponent(url)}` });
    },

    goToBook: function() {
        let url = "https://api.jhucssa.com/book/"
        this.goToWeb(url)
    },

    getEvents: function() {
        const thisPage = this;
        getEvents(4).then(
            res => {
                thisPage.setData({ eventUrls: res.data });
                wx.setStorageSync("myEvents", this.data.eventUrls);

            },
            _err => {
                showError();
            }
        );
    },

    bindUclWarn: function() {
        if (app.globalData.ucl) {
            this.setData({ ucl: app.globalData.ucl });
            return;
        }

        const action = this.data.hasUserInfo ? "授权UCL账号" : "先登录";

        wx.showModal({
            showCancel: false,
            title: "提示",
            content: `您需要${action}才能够查看课表`
        });
    }
});
