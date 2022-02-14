export const resourceConfig = {
    userInfo: null,
    imgDomain: "https://api.jhucssa.com/api/img/",
    iconHome: "https://api.jhucssa.com/api/img/icon-home-red.png",
    iconForward: "https://api.jhucssa.com/api/img/icon-forward-red.png",
    iconSearch: "https://api.jhucssa.com/api/img/icon-search.png",
    ifanrID: wx.getStorageSync("ifanrid") || null,
    ucl: wx.getStorageSync("ucl") || null,
    baasInfo: wx.getStorageSync("user") || null,
    notice: wx.getStorageSync("notice") || null
};
