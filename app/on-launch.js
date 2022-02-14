import { baasLogin, logger } from "../app/core-functions.js";
import { BaaSApiToken } from "../baas-api-token.js";

export const onLaunch = () => {
    wx.BaaS = requirePlugin("sdkPlugin");
    wx.BaaS.wxExtend(wx.login);

    wx.BaaS.init(BaaSApiToken);

    wx.cloud.init();

    wx.showToast({
        title: "登录中...",
        icon: "loading",
        mask: true,
        duration: 3000,
    });

    wx.BaaS.auth.loginWithWechat(null, true).then(
        _user => {
            console.log("guest logged in");
            logger("baas","guest-logged-in", null);
        },
        err => {
            console.log("guest log in failed");
            logger("baas","guest-login-failed", err.toString, true);
        }
    );


    wx.login({
        success: _res => {
            getApp().globalData.code = _res.code;// 发送 res.code 到后台换取 openId, sessionKey, unionId
        },
    });

    wx.onUserCaptureScreen(_res => {
        console.log("screen captured");
        logger("log","screenshot", null);
    });

    baasLogin();
    // 获取用户信息
    // wx.getSetting({
    //     success: res => {
    //         if (res.authSetting["scope.userInfo"]) {
    //             // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
    //             wx.getUserProfile({
    //                 success: res => {
    //                     //登录BaaS, 并注册用户到我们服务器上
    //                     let e = {detail:res}
    //                     baasLogin(e);

    //                     // 可以将 res 发送给后台解码出 unionId
    //                     getApp().globalData.userInfo = res.userInfo;

    //                     /*
    //                      * 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
    //                      * 所以此处加入 callback 以防止这种情况
    //                      */
    //                     if (getApp().userInfoReadyCallback) {
    //                         console.log("userinfo callback");
    //                         getApp().userInfoReadyCallback(res);

    //                         getApp().getUcl();
    //                         getApp().getNotice();
    //                     }
    //                 },
    //             });
    //         }else{
    //           console.log("NOT Logged in");
    //           if (getApp().userInfoNotReadyCallback) {
    //             getApp().userInfoNotReadyCallback();
    //           }
    //         }
    //     },
    // });
};
