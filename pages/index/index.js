const app = getApp();
const initialLibrary = [
    {
        name: "Student Centre",
        condition: "",
        pgrs: 0,
        remain: "加载中...",
    },
    {
        name: "Main Library",
        condition: "",
        pgrs: 0,
        remain: "加载中...",
    },
    {
        name: "Science Library",
        condition: "",
        pgrs: 0,
        remain: "加载中...",
    },
    {
        name: "IOE Library",
        condition: "",
        pgrs: 0,
        remain: "加载中...",
    },
];
const initialTbDummy = [
    { sessions: [{}, {}, {}] },
    { sessions: [{}, {}, {}] },
    { sessions: [{}, {}, {}] },
];
const initialPostDummy = [{}, {}, {}];
const initialTubeDummy = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];

const moment = require("../../utils/moment.min.js");

import {
    hideAll,
    showError,
    updateUserInfo,
} from "../../app/common-functions.js";
import {
    baasLogin,
    getEvents,
    getNotice,
    logger,
    request,
} from "../../app/core-functions.js";
import { getTodayDate } from "../../utils/format-time.js";
import { getWeather } from "../../utils/weather.js";
import { getTubeColour, getTubeStatus } from "../../utils/tfl.js";
import { getFeeds } from "../../app/feed-actions.js";

function getTimetable(){
    // 改成自己的逻辑
    return new Promise(function(resolve) { 
        setTimeout(resolve.bind(null, initialTbDummy), 2000)
    });
}

function getWorkspaces(){
    // 改成自己的逻辑
    return new Promise(function(resolve) { 
        setTimeout(resolve.bind(null, initialLibrary), 2000)
    });
}


Page({
    data: {
        ucl: app.globalData.ucl,
        imgUrls: wx.getStorageSync("slides") || [],
        eventUrls: wx.getStorageSync("events") || [],
        covid: wx.getStorageSync("covid") || null,
        indicatorDots: false,
        autoplay: true,
        interval: 7000,
        duration: 700,
        ifanrID: -1,
        imgComment: app.globalData.imgDomain + "icon-comment.png",
        imgCalendar: app.globalData.imgDomain + "icon-schedule-new.png",
        imgLibrary: app.globalData.imgDomain + "icon-library-black.png",
        imgCommunity: app.globalData.imgDomain + "icon-discussion-forum.png",
        imgMore: app.globalData.imgDomain + "icon-next-page.png",
        imgBus: app.globalData.imgDomain + "icon-bus.png",
        imgShare: app.globalData.imgDomain + "icon-share-white.png",
        imgVirus: "https://img.icons8.com/ios-filled/50/000000/virus.png",
        weatherIcon:
            "https://cloud-minapp-24046.cloud.ifanrusercontent.com/1hWQz0qeACsMpo17.png",
        timetable: wx.getStorageSync("timetable") || initialTbDummy,
        posts: wx.getStorageSync("feeds") || initialPostDummy,
        tube: wx.getStorageSync("tube") || initialTubeDummy,
        library: initialLibrary,
        todayDate: "JHU在校生活平台",
        todayWeather: "天气正在加载中...",
        tubeColours: getTubeColour(),
        home: true, //for footer
        showIsAdmin: true,
    },

    onLoad: function(options) {
        wx.showToast({
            title: "加载中...",
            icon: "loading",
            mask: true,
            duration: 1000,
        });

        //----load all
        this.loadContent();

        /*
         *----load user info
         *等待app.js登陆成功，callback设置当前用户的userinfo和头像
         */
        app.userInfoReadyCallback = _res => {
            updateUserInfo(this);
        };

        //----load baas info
        if (!app.globalData.ifanrID) {
            baasLogin();
        }

        app.uclReadyCallback = _res => {
            if (this.data.ucl) return;
            console.log("ucl callback called");
            this.setData({ ucl: app.globalData.ucl });
            this.getTimetable();
        };

        //if webview url
        if (options.web) {
            this.goToWeb(options.web, true);
        }

        this.getIsAdmin();
    },

    getIsAdmin: function() {
        wx.BaaS.invoke("checkIsAdmin", { user: app.globalData.ifanrID }).then(res => {
            console.log(res.data.data);
            app.globalData.isAdmin = res.data.data.is_admin;
            this.setData({
                isAdmin: res.data.data.is_admin,
                showIsAdmin: true,
            });
            setTimeout(() => {
                this.setData({ showIsAdmin: false });
            }, 5000);
        });
    },

    loadContent: function() {
        console.log("start loading content...");
        //----load ucl info
        if (!app.globalData.ucl) {
            app.getUcl();
        }
        this.setData({
            ifanrID: app.globalData.ifanrID,
            ucl: app.globalData.ucl,
        });
        this.getEvents();
        this.getNotice();
        // this.getTimetable();
        // this.getWorkspaces();
        this.getTodayWeather();
        this.getFeeds();
        this.startDateTitleTransition();
        this.getTubeStatus();
        // this.loadCovidData();
        // this.getUclCovid();
    },

    onShow: function() {
        if (!this.data.userInfo || app.globalData.needUpdate) {
            updateUserInfo(this);
            app.globalData.needUpdate = false;
        }
        if (this.data.imgUrls.length === 0) {
            this.loadContent();
        }
    },

    onPullDownRefresh: function() {
        this.loadContent();

        updateUserInfo(this);
    },

    onShareAppMessage: getApp().onShareAppMessage,

    onShareTimeline: getApp().onShareAppMessage,

    onPageScroll: function(res) {
        // rpx to px: http://www.wxapp-union.com/article-3832-1.html
        const rpx = 100;
        const systemInfo = wx.getSystemInfoSync();
        const px = rpx / 750 * systemInfo.windowWidth;

        if (res.scrollTop >= px) {
            this.setData({ showPlaceholder: true });
        } else {
            this.setData({ showPlaceholder: false });
        }
    },

    getEvents: function(_concat, _postIdStart, _postIdEnd) {
        wx.showNavigationBarLoading();
        const thisPage = this;

        getEvents(1).then(
            res => {
                thisPage.setData({ imgUrls: res.data });
                wx.setStorageSync("slides", this.data.imgUrls);

                hideAll(this);
            },
            _err => {
                hideAll(this);
                showError();
            }
        );

        getEvents(2).then(
            res2 => {
                thisPage.setData({ eventUrls: res2.data });
                wx.setStorageSync("events", this.data.eventUrls);
                console.log(this.data.eventUrls);
            },
            _err => {
                showError();
            }
        );
    },

    getNotice: function() {
        const thisPage = this;
        if (app.globalData.notice) {
            thisPage.setData({ notice: app.globalData.notice });
            // return;
        }

        wx.showNavigationBarLoading();

        getNotice().then(
            res => {
                thisPage.setData({ notice: res.data });
                app.globalData.notice = res.data;
                hideAll(this);
            },
            _err => {
                showError();
                hideAll(this);
            }
        );
    },

    getTimetable: function() {
        this.setData({ loaded_tb: false });
        const id = app.globalData.ifanrID;
        const thisPage = this;
        if (id) {
            getTimetable(id).then(
                res => {
                    thisPage.setData({
                        timetable: res.data,
                        loaded_tb: true,
                    });
                    app.globalData.timetable = res.data;
                },
                _err => {
                    showError();
                }
            );
        }
    },

    getTodayWeather: function() {
        const thisPage = this;
        getWeather().then(
            res => {
                thisPage.setData({ todayWeather: res });
            },
            _err => {
                showError();
            }
        );
    },

    getTubeStatus: function() {
        this.setData({ loaded_tube: false });
        const thisPage = this;
        getTubeStatus().then(
            res => {
                thisPage.setData({
                    tube: res,
                    loaded_tube: true,
                });
                wx.setStorageSync("tube", res);
            },
            _err => {
                showError();
            }
        );
    },

    getWorkspaces: function() {
        this.setData({ loaded_lib: false });
        const that = this;
        // getWorkspaces().then(
        //     res => {
        //         res.data.surveys.forEach(element => {
        //             switch (element.id) {
        //                 case 58: //student centre
        //                     that.data.library[0] = getLibraryData(
        //                         element,
        //                         that.data.library[0].name
        //                     );
        //                     break;
        //                 case 19: //science library
        //                     that.data.library[2] = getLibraryData(
        //                         element,
        //                         that.data.library[2].name
        //                     );
        //                     break;
        //                 case 38: //main library
        //                     that.data.library[1] = getLibraryData(
        //                         element,
        //                         that.data.library[1].name
        //                     );
        //                     break;
        //                 case 46: //ioe
        //                     that.data.library[3] = getLibraryData(
        //                         element,
        //                         that.data.library[3].name
        //                     );
        //                     break;
        //                 default:
        //                     break;
        //             }
        //         });
        //         that.setData({
        //             library: that.data.library,
        //             loaded_lib: true,
        //         });
        //         console.log(that.data.library);
        //     },
        //     _err => {
        //         showError();
        //     }
        // );
    },

    getFeeds: function() {
        this.setData({ loaded_post: false });
        const thisPage = this;

        getFeeds(thisPage.data.ifanrID).then(
            res => {
                if (res.posts) {
                    thisPage.setData({
                        posts: res.posts,
                        loaded_post: true,
                    });
                    console.log(`get-feeds-success:homepage`);
                }
                console.log(res);
            },
            _err => {
                hideAll(this);
                showError();
                console.log(`get-feeds-failed:homepage`);
            }
        );
    },

    startDateTitleTransition: function() {
        const that = this;
        setTimeout(function() {
            that.setData({ animationClass: "opacity_zero" });
        }, 2000);
    },

    finishDateTitleTransition: function() {
        this.setData({
            animationClass: "",
            todayDate: getTodayDate(),
        });
    },

    bindWeb: function(e) {
        const { url } = e.currentTarget.dataset;
        console.log(url);

        if (url.includes("http")) {
            this.goToWeb(url);
        } else {
            if (url.includes("pages/restaurant")) {
                wx.switchTab({ url: "/pages/restaurant/restaurant" });
            }
            wx.navigateTo({ url });
        }
    },

    loadCovidData: function() {
        const thisPage = this;
        request("covid").then(
            res => {
                console.log(res.data);
                // res.data.updated = moment(res.data.today[0].ts).fromNow()
                thisPage.setData({
                    covid: res.data,
                    loaded_covid: true,
                });
                wx.setStorageSync("covid", res.data);
            },
            err => {
                logger("covid", "get-covid-fail", null, true);
                console.log(err);
            }
        );
    },

    subscribeCovid: function() {
        //subscribe message
        const form_id = "yTb3_BDbYYLwggfYda_bV9TOYUd7W3SEcyetNrAdtGQ";
        const that = this;
        wx.requestSubscribeMessage({
            tmplIds: [form_id],
            success: res => {
                logger("covid", "subscribe-message-accepted", form_id);
                const subscription = [];
                if (res[form_id] === "accept") {
                    subscription.push({
                        template_id: form_id,
                        subscription_type: "once",
                    });
                }
                wx.BaaS.subscribeMessage({ subscription }).then(
                    res => {
                        wx.BaaS.invoke("covidAddNotification", { user: app.globalData.ifanrID });
                        const sub = this.data.covidSub;
                        if (!sub) {
                            wx.showModal({
                                title: "订阅成功",
                                content:
                                    "您已成功订阅下一次更新提醒。如果您想订阅多次，您可以继续点击订阅按钮增加提醒数量。",
                                showCancel: false,
                            });
                        }
                        that.setData({ covidSub: sub ? sub + 1 : 1 });
                    },
                    err => {
                        // fail
                    }
                );
            },
            fail: err => {
                console.log("rejected!!");
                logger("covid", "subscribe-message-rejected", form_id);
            },
        });
        //subscribe message end
    },

    goToCovid: function() {
        //wx.navigateTo({ url: `/pages/ucl/timetable/timetable` });
        this.goToWeb(this.data.covid.url);
        /*
         * wx.switchTab({
         *   url: '/pages/covid/covid'
         * })
         */
    },

    goToWeb: function(url, encoded) {
        const urlEncoded = encoded ? url : encodeURIComponent(url);
        wx.navigateTo({ url: `/pages/web/web?url=${urlEncoded}` });
    },

    goToTimetable: function() {
        wx.switchTab({ url: `/pages/timetable/timetable` });
        // this.goToWeb("https://api.jhucssa.com/timetable?id=##ifanrid##")
    },

    goToTbLocation: function(e) {
        this.goToTimetable();
        setTimeout(() => {
            wx.navigateTo({
                url:
                    "/pages/ucl/map/map?tblocation="
                    + JSON.stringify(e.currentTarget.dataset.loc),
            });
        }, 1000);
    },

    goToCommunity: function() {
        wx.switchTab({ url: `/pages/discover/discover` });
    },

    goToMe: function() {
        if (app.globalData.ucl) {
            // wx.startPullDownRefresh()
            this.setData({
                ifanrID: app.globalData.ifanrID,
                ucl: app.globalData.ucl,
            });
            this.getTimetable();
        } else {
            wx.switchTab({ url: `/pages/me/me` });
        }
    },

    goToWorkspace: function() {
        wx.navigateTo({ url: `/pages/ucl/library/library` });
    },

    goToTfl: function(url) {
        const tflUrl = "https://api.jhucssa.com/api/tfl-status/";
        this.goToWeb(tflUrl);
    },

    goToBook: function() {
        const url = "https://book.api.jhucssa.com/";
        this.goToWeb(url);
    },

    goToAbout: function(url) {
        const aboutUrl = "https://api.jhucssa.com/about";
        this.goToWeb(aboutUrl);
    },
});

const green = "linear-gradient(to right, #dce35b, #45b649)";
const darkGreen = "linear-gradient(to right, #dce35b, #FDC830)";
const orange = "linear-gradient(to right, #FED524, #F95A57)";
const red = "linear-gradient(to right, #FF7500,#DC033A)";

function getLibraryData(survey, name) {
    let condition = "未知";
    let bgColor = null;
    const percentage = Math.round(100
            * (survey.sensors_occupied
                / (survey.sensors_occupied + survey.sensors_absent)));

    if (percentage != null) {
        if (percentage >= 25) {
            if (percentage >= 50) {
                if (percentage >= 80) {
                    condition = "非常拥挤";
                    bgColor = red;
                } else {
                    condition = "人数较多";
                    bgColor = orange;
                }
            } else {
                condition = "比较安静";
                bgColor = darkGreen;
            }
        } else {
            condition = "非常安静";
            bgColor = green;
        }
    }

    const remain = 100 - percentage + "%空闲";
    return {
        name,
        condition,
        pgrs: percentage,
        remain,
        bg: bgColor,
    };
}
