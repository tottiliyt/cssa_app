import { resourceConfig } from "../app/resource-config.js";

export function baasLogin() {
  console.log("[baasLogin app.onLoad] BaaS Login invoked");
  wx.BaaS.auth.loginWithWechat()
    .then(
      user => {
        console.log("[baasLogin app.onLoad] BaaS Login with WeChat successul", user.id);
        logger("baas","baas-auth-success", null);

        wx.setStorageSync("user", user);
        resourceConfig.baasInfo = user;

        if (!user._anonymous && user.nickname && user.nickname !== "微信用户") {
          registerUserToServer(user);
          getApp().globalData.userInfo = {
            avatarUrl: user.avatar,
            city: user.city,
            province: user.province,
            country: user.country,
            gender: user.gender,
            language: user.language,
            nickName: user.nickname,
          };
        }
      },
      err => {
        console.log("[baasLogin app.onLoad] BaaS Login with WeChat failed", err);
        logger("baas","baas-auth-error", err.toString, true);
      }  
    ); 

    const app = getApp()
}

function registerUserToServer(user) {
    //this will run a middle server (BaaS) function to transfer all user info into our backend, TODO
    resourceConfig.ifanrID = user.id;
    wx.setStorageSync("ifanrid", user.id);
    request("post", {
      action: "register",
      content: JSON.stringify(user),
      user: getApp().globalData.ifanrID,
    }).then(
      res => {
        console.log("register success");
        console.log(res);
      },
      err => {
        console.log(err);
      }
    );
}

export function request(requestType, requestData) {
    console.log("requesting..." + requestType)
    return new Promise((resolve, reject) => {
        wx.request({
            url: `https://api.jhucssa.com/api/portal.php?type=${requestType}`,
            data: requestData,
            header: { "content-type": "application/json" },
            method: "POST",
            success(res) {
                //console.log(res);
                resolve(res);
            },
            fail: err => {
                let errmsg = requestType + " " + err.errMsg
                console.log(errmsg);
                logger("request","request-fail", errmsg, true);
                reject(err);
            }
        });
    });
}

export function logger(classLog, actionLog, contentLog, _isError) {
  // return; //TODO DEBUGGE ONLY
    request("post", {
        action: "log",
        content: `{ "class": "${classLog}",
                   "action": "${actionLog}",
                   "query": "${contentLog ? contentLog.replace(/"/g, '\\\"') : contentLog}",
                   "user": "${getApp().globalData.ifanrID}",
                   "page": "${getCurrentPages()[getCurrentPages().length - 1].route}" }`,
        user: getApp().globalData.ifanrID,
    }).then(res => console.log(res.data), err => console.log(err));
}

export function getNotice() {
    return new Promise((resolve, reject) => {
      request("get", {
            action: "notice",
            // content: `{ "type": "global" }`,
            user: getApp().globalData.ifanrID
        }).then(
            res => {
                console.log(res);
                getApp().globalData.notice = res.data;
                wx.setStorageSync("notice", res.data);
                resolve(res);
            },
            err => {
                console.log(err);
                reject(err);
            }
        );
    });
}

export function getEvents(type) {
    return new Promise((resolve, reject) => {
      request("get", {
            action: "events",
            user: getApp().globalData.ifanrID,
            content: `&type=${type}`
        }).then(
            res => {
                console.log(res)
                resolve(res);
                
            },
            err => {
                console.log(err);
                reject(err);
            }
        );
    });
}


export function checkIsLoggedIn(){
  return new Promise((resolve, reject) => {
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting["scope.userInfo"]) {
          resolve(true)
        } else {
          resolve(false)
        }
      },
    });
  })
}