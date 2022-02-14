import { request, logger } from "core-functions.js";
import { getDateFromTimestamp, getCurrentTime } from "../utils/format-time.js";


export function getRestaurants(id) {
  return new Promise((resolve, reject) => {
    request("get", {
      action: "restaurant",
      content: id ? "id=" + id : null,
      user: getApp().globalData.ifanrID,
    }).then(
      res => {
        console.log("-restaurants-----------------------------------------------------");
        console.log(res);
        if (res.data) {

          res.data.forEach((element) => {
            let tags = element.tags.split(",")
            if(element.price){
              tags.unshift("£".repeat(element.price))
            }
            element.tags = tags
          })

          resolve(res);
        } else {
          reject();
        }
      },
      err => {
        console.log(err);
        reject();
      }
    );
  });
}

export function getUserLocation(strict) { //获取用户的当前设置
  return new Promise((resolve, reject) => {
    wx.getSetting({
      success: (res) => {
        // res.authSetting['scope.userLocation'] == undefined    表示 初始化进入该页面
        // res.authSetting['scope.userLocation'] == false    表示 非初始化进入该页面,且未授权
        // res.authSetting['scope.userLocation'] == true    表示 地理位置授权
        if (res.authSetting['scope.userLocation'] != undefined && res.authSetting['scope.userLocation'] != true) {
          //未授权
          if (!strict){ reject("userDeniedLocationPermission"); return; }

          wx.showModal({
            title: '请求授权当前位置',
            content: '学联卡以及商家检索服务需要您的位置信息才可正常使用，点击确认即可前往设置更改授权。',
            success: function (res) {
              if (res.cancel) {
                //取消授权
                logger("restaurant", "get-location-denied", "second-time-warning-canceled")
                wx.showToast({
                  title: '您可能无法正常使用某些功能',
                  icon: 'none',
                  duration: 3000
                })
                reject("userDeniedLocationPermission2");
              } else if (res.confirm) {
                //确定授权，通过wx.openSetting发起授权请求
                wx.openSetting({
                  success: function (res) {
                    if (res.authSetting["scope.userLocation"] == true) {
                      logger("restaurant", "get-location-permission-granted", "second-time-warning-accepted")
                      wx.showToast({
                        title: '授权成功',
                        icon: 'success',
                        duration: 1000
                      })
                      //再次授权，调用wx.getLocation的API
                      return wxGetLocation();
                    } else {
                      logger("restaurant", "get-location-denied", "second-time-warning-opened-settings-but-denied")
                      wx.showToast({
                        title: '授权失败，您可能无法正常使用某些功能',
                        icon: 'none',
                        duration: 3000
                      })
                      reject("userDeniedLocationPermission3");
                    }
                  }
                })
              }
            }
          })
        } else if (res.authSetting['scope.userLocation'] == undefined) {
          //用户首次进入页面,调用wx.getLocation的API
          logger("restaurant", "get-location-popup", "first-time")
          resolve(wxGetLocation());
        }
        else {
          // console.log('授权成功')
          //调用wx.getLocation的API
          resolve(wxGetLocation());
        }
      }
    })

  })
}


function wxGetLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      success: res => {
        console.log(res.latitude, res.longitude)
        logger("location", "get-location-success", JSON.stringify(res))
        resolve(res)
      },
      fail: err=> {
        logger("location", "get-location-fail", JSON.stringify(err))
        console.log(err);
        resolve(getUserLocation(true))
      }
    })
  })
}


export function sortArray(restaurantArray, sortBy){
  switch(sortBy){
    case "distance":
      restaurantArray.sort((a, b) => (a.distance - b.distance)); 
      break;
    case "id":
      restaurantArray.sort((a, b) => (a.discount_value - b.discount_value)); 
      break;
    case "name":
      restaurantArray.sort((x, y) => x.name.localeCompare(y.name, 'zh-CN'))
      break;
    default:
      restaurantArray.sort((a, b) => (a[sortBy] > b[sortBy]) ? 1 : ((b[sortBy] > a[sortBy]) ? -1 : 0)); 
      break;
  }
  
  return restaurantArray;
}


export function appendDistance(restaurantArray, currentLocation){
  restaurantArray.forEach((element) => {
    let longlat = element.longlat.split(",")
    element.distance = getDistance(currentLocation.latitude, currentLocation.longitude, longlat[0], longlat[1]);
  })
  return restaurantArray;
}


export function countTags(restaurantArray) {
  let tags = []
  restaurantArray.forEach((element) => {
    element.tags.forEach((tag) => {
      if (tags.indexOf(tag) === -1 && tag.search("£")==-1) {
        tags.push(tag);
      }
    })
  })
  console.log(tags)
  return tags;
}


// ref https://stackoverflow.com/questions/27928/

function getDistance(lat1, lon1, lat2, lon2) {
  var p = 0.017453292519943295;    // Math.PI / 180
  var c = Math.cos;
  var a = 0.5 - c((lat2 - lat1) * p) / 2 +
    c(lat1 * p) * c(lat2 * p) *
    (1 - c((lon2 - lon1) * p)) / 2;

  return (12742 * Math.asin(Math.sqrt(a))).toFixed(2); // 2 * R; R = 6371 km
}


export function checkMembership(){
  return new Promise((resolve, reject) => {
    wx.BaaS.invoke("checkMembership", {
      ifanrid: getApp().globalData.ifanrID,
    }).then(
      res => {
        console.log(res.data);
        if (res.data === "ok") {
          resolve("ok");
        } else {
          reject("not_found");
        }
      },
      err => {
        console.log(err);
        reject();
      }
    );
  });
}


export function activateMembership(order, email) {
  return new Promise((resolve, reject) => {
    wx.BaaS.invoke("activateMembership", {
      ifanrid: getApp().globalData.ifanrID,
      email: email,
      order: order
    }).then(
      res => {
        console.log(res.data);
        if (res.data === "ok") {
          logger("card", "card-activated", order + " - " + email)
          resolve("ok");
        } else {
          logger("card", "card-activate-failed", order + " - " + email + " - " + res.data)
          reject(res.data);
        }
      },
      err => {
        logger("card", "card-activate-failed", order + " - " + email)
        console.log(err);
        reject();
      }
    );
  });
}
