import { logger } from "../../app/core-functions.js";

var urlChecker;

Page({
    data: { url: "https://api.jhucssa.com/",
            lastAllowed: "https://api.jhucssa.com/" },

    onLoad: function(options) {
        let currentUrl = decodeURIComponent(options.url)
        currentUrl = currentUrl.replace("##ifanrid##", getApp().globalData.ifanrID)
        console.log(currentUrl);
      this.setData({ url: currentUrl, lastAllowed: currentUrl });
        logger("web","web-url", currentUrl);

      if (currentUrl.search("weixin.qq.com") != -1){
          //改变标题栏为微信颜色
          wx.setNavigationBarColor({
            frontColor: '#000000',
            backgroundColor: '#f2f2f2',
            animation: {
              duration: 500,
              timingFunc: 'easeIn'
            }
          })
          
        }

      if (currentUrl.search("covid19.api.jhucssa.com") != -1) {
        //改变标题栏
        wx.setNavigationBarColor({
          frontColor: '#000000',
          backgroundColor: '#f5f5f5',
          animation: {
            duration: 500,
            timingFunc: 'easeIn'
          }
        })

      }


        // if (currentUrl.search("restaurants/card") != -1){
        //   //改变标题栏为学联卡颜色
        //   wx.setNavigationBarColor({
        //     frontColor: '#ffffff',
        //     backgroundColor: '#0f0f0f',
        //     animation: {
        //       duration: 500,
        //       timingFunc: 'easeIn'
        //     }
        //   })
          
        // }


      // urlChecker = setInterval(() => {
      //   console.log("checking..." + this.data.currentUrl)
      //   this.checkUrlValid(this.data.currentUrl)
      // }, 1000)
    },

    onUnload: function(){
      clearInterval(urlChecker);
    },

    onShareAppMessage: function (options) {
      console.log(options)
      let shareUrl = options.webViewUrl.replace(getApp().globalData.ifanrID, "##ifanrid##")
      logger("web", "share", shareUrl);

      let sharePath = `pages/index/index?web=${encodeURIComponent(shareUrl)}`
      let isFreshersBook = this.data.currentUrl.search("book.api.jhucssa.com") != -1;

      if (isFreshersBook && this.data.currentUrl == "https://book.api.jhucssa.com/"){
        return {
          title: "【官方】JHU新生手册",
          imageUrl: 'https://cloud-minapp-24046.cloud.ifanrusercontent.com/xssc1.png',
          path: sharePath
        }
      }

      return{
        title: "JHU在校生活平台",
        path: sharePath
      }
    
    },

    onShareTimeline: ()=>this.onShareAppMessage,


    webload: function(e){
      console.log(e)
      let currentUrl = e.detail.src
      this.setData({ currentUrl: currentUrl })

      this.checkUrlValid(currentUrl)
     
      logger("web","web-loaded", currentUrl);

      if (currentUrl.search("api.jhucssa.com/book") != -1) {
        wx.setNavigationBarTitle({
          title: 'JHUCSSA新生手册'
        })
      }

    },

    weberror: function(e){
      console.log("web-error")
      logger("web","web-error", e.detail.src);
    },


    checkUrlValid: function(currentUrl){
      if(!currentUrl) return;
      if (this.isUrlInvalid(currentUrl)) {
        clearInterval(urlChecker);

        //不允许的网址，重新载入上一个允许的网址
        logger("web","illegal-url-reloaded", currentUrl);

        let returnUrl = (this.data.lastAllowed && this.isUrlInvalid(this.data.lastAllowed))? "https://api.jhucssa.com/about" : this.data.lastAllowed;
        wx.redirectTo({
          url: 'web?url=' + encodeURIComponent(returnUrl)
        })

        wx.setClipboardData({
          data: currentUrl,
          success: function (_res) {
            wx.showModal({
              title: '该网址已复制',
              content: '由于微信限制，您可以粘贴此网址在浏览器内打开。',
              showCancel: false
            })
          }
        });

      } else {
        this.setData({ lastAllowed: currentUrl })
      }
    },

    isUrlInvalid: function(currentUrl){
      return (currentUrl.search("api.jhucssa.com") === -1 &&
        currentUrl.search("mp.weixin.qq.com") === -1 ) ||
        currentUrl.search("facebook.com") != -1;
    }
});
