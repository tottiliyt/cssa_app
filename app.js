import { onLaunch } from "./app/on-launch.js";
import { resourceConfig } from "./app/resource-config.js";
import { getNotice, logger } from "./app/core-functions.js";

const appFunctionalities = {
    onLaunch,
    globalData: resourceConfig,
    getNotice,
    getUcl: function(){
        return {}
    },
    onShow: function (options) {
        wx.BaaS.reportTemplateMsgAnalytics(options)
    },
    //Called when user click on the top right corner to share
    onShareAppMessage: function (res) {
        if (res.from === 'button') {
            logger("share", "share-button-clicked", "home-page");
        }

        return {
            title: "JHU在校生活平台 - 一键掌握JHU学习生活",
            imageUrl: 'https://cloud-minapp-24046.cloud.ifanrusercontent.com/1hptBgq3Fm4IkfRQ.png',
            success: function (res) {
                // 转发成功
                logger("share", "share", "home-page");
                wx.showToast({
                    title: '分享成功',
                    icon: 'success'
                })
            },
            fail: function (res) {
                console.log(res)
                logger("share", "share-failed", res);
                this.showError()
                // 转发失败
            }
        }


    },
};

App(appFunctionalities);
