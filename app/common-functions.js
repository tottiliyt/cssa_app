export function hideAll(that) {
    if (that) {
        that.setData({ loading: false });
    }
    wx.hideToast();
    wx.hideLoading();
    wx.hideNavigationBarLoading();
    wx.stopPullDownRefresh();
}

export function showError(msg) {
    const message = msg ? msg : "网络不好，刷新一下吧";
    wx.hideNavigationBarLoading();
    wx.showToast({
        title: message,
        icon: "none",
        duration: 3000
    });
}

export function updateUserInfo(that) {
    const app = getApp();
    if (app.globalData.userInfo) {
        that.setData({
            userInfo: app.globalData.userInfo,
            avatar: app.globalData.userInfo.avatarUrl
        });
    }
}
