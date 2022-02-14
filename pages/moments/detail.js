const app = getApp();

import { hideAll, showError } from "../../app/common-functions.js";
import {
    getFeeds,
    likePost,
    removeTarget,
    submitComment,
    sendPushNotification
} from "../../app/feed-actions.js";
import { logger } from "../../app/core-functions.js";

Page({
    data: {
        avatar: app.globalData.imgDomain + "profile.jpg",
        imgLike: app.globalData.imgDomain + "icon-like.png",
        imgLiked: app.globalData.imgDomain + "icon-like-active.png",
        imgShare: app.globalData.imgDomain + "icon-share.png",
        imgComment: app.globalData.imgDomain + "icon-comment.png",
        imgCopy: app.globalData.imgDomain + "icon-copy.png",
        imgDelete: app.globalData.imgDomain + "icon-trash-red.png",
        iconHome: app.globalData.iconHome,
        ifanrID: wx.getStorageSync("ifanrid") || -1,
        replyto: "",
        post_owner: false
    },

    bindMsg: function(){
      //subscribe message
      // TODO 配置发消息在这里！
    //   let form_id = "mpvsTVURqrmbRs4L0NTpju0EJzIndV3pkLxkLgo7Trw"

    //   wx.requestSubscribeMessage({
    //     tmplIds: [form_id],
    //     success: (res) => {
    //       logger("comment", "subscribe-message-accepted", form_id);
    //       let subscription = []
    //       if (res[form_id] === 'accept') {
    //         subscription.push({
    //           template_id: form_id,
    //           subscription_type: 'once',
    //         })
    //       }
    //       wx.BaaS.subscribeMessage({ subscription }).then(res => {
    //         // success
    //       }, err => {
    //         // fail
    //       })
    //     },
    //     fail: (err) => {
    //       console.log("rejected!!")
    //       logger("comment", "subscribe-message-rejected", form_id);
    //     }
    //   })
        //subscribe message end
    },

    bindFormSubmit(e) {
        // let formID = e.detail.formId
        // wx.BaaS.wxReportTicket(formID).then(res => {
        //   console.log("form tickect success " + formID)
        //   logger("form","form-collected", formID);
        // }, err => {
        //   logger("form","form-collect-failed", formID);
        //   // fail
        // })

        console.log(e.detail.value.textarea);
        if (e.detail.value.textarea !== "") {

            //textarea is not empty, invoke
          this.submitComment(e.detail.value.textarea);

          

        } else {
            wx.showToast({
                title: "写点什么吧",
                icon: "none",
                duration: 1500
            });
        }
    },

    onLoad: function(options) {
        this.setData({
            ifanrID: getApp().globalData.ifanrID,
            post_id: options.id
        });

        if (getApp().globalData.isAdmin) {
          this.setData({
            isAdmin: getApp().globalData.isAdmin
          })
        }

        wx.startPullDownRefresh();
        //after feeds for error fallback
        this.setData({ post: JSON.parse(options.post) });
    },

    onPullDownRefresh: function() {
        this.getFeeds(this.data.post_id);
    },

    onShareAppMessage: function() {
        const thisPage = this;

        console.log("Share:");
        logger("share","share", thisPage.data.post_id);

        return { title: `【动态】 ${this.data.post.content}` };
    },

    onShareTimeline: function() {
        const thisPage = this;

        console.log("Share:");
        logger("share","share", thisPage.data.post_id);

        return { title: `【JHU动态】 ${this.data.post.content}` };
    },

    getFeeds: function(postID) {
        const thisPage = this;
        wx.showNavigationBarLoading();

        if (!postID) {
            postID = -1;
        }

        getFeeds(thisPage.data.ifanrID, null, postID).then(
            res => {
                hideAll(this);
                console.log(res);

                const post = res.posts[0];

                //if post not exist, return immediately
                if (!post) {
                    wx.navigateBack();
                    showError("该动态不存在");

                    return;
                }

                //set to post owner to display delete button
                if (post.user_id == thisPage.data.ifanrID) {
                    console.log("owner");
                    this.setData({ post_owner: true });
                }

                thisPage.setData({ post });
            },
            _err => {
                hideAll(this);
                showError();
            }
        );
    },

    invokeLike: function(_event) {
        if (getApp().globalData.userInfo == null) {
            this.pleaseLogin();
            return;
        }

        //if already liked, return
        if (this.data.post.liked) {
            return;
        }

        //set UI to liked first
        const likes = parseInt(this.data.post.likes, 10);
        this.setData({
            ["post.liked"]: true,
            ["post.likes"]: [likes + 1]
        });

        const thisPage = this;

        likePost(thisPage.data.ifanrID, this.data.post_id).then(
            res => {
                console.log(res);
            },
            _err => {
                //if failed, set UI to unliked
                showError("赞失败，网络异常");
                this.setData({
                    ["post.liked"]: false,
                    ["post.likes"]: [likes]
                });
            }
        );
    },

    removePost: function(targetId, targetType, adminOverrideId) {
        const thisPage = this;
        wx.showLoading({
            title: "正在删除...",
            mask: true,
            duration: 5000
        });

        let userid = thisPage.data.isAdmin? adminOverrideId : thisPage.data.ifanrID;

        removeTarget(userid, targetId, targetType).then(
            _res => {
                getApp().globalData.needFeedRefresh = true;

                if (targetType == "post") {
                    //if target is a post, that mean this page is gone, go back immediately
                    wx.switchTab({ url: "../discover/discover" });
                } else {
                    //otherwise only a comment is deleted
                    this.onPullDownRefresh();
                }

                wx.showToast({
                    title: "删除成功",
                    icon: "success",
                    duration: 3000
                });
            },
            _err => {
                showError();
            }
        );
    },

    pleaseLogin: function() {
        wx.showModal({
            title: "提示",
            content: "您必须要登录才能够进行此操作，现在就登录？",
            success(res) {
                if (res.confirm) {
                    wx.switchTab({ url: "/pages/me/me" });
                }
            }
        });
    },

    submitComment: function(text) {
        if (getApp().globalData.userInfo == null) {
            this.pleaseLogin();
            return;
        }

        wx.showToast({
            title: "等一下啊...",
            icon: "loading",
            mask: true,
            duration: 10000
        });

        submitComment(this.data.ifanrID, text, this.data.post_id).then(
            _res => {
                this.setData({ showModal: false });

                getApp().globalData.needFeedRefresh = true;
                this.onPullDownRefresh();
                wx.showToast({
                    title: "评论成功!",
                    duration: 2000
                });
                
                // wx.showModal({
                //   title: '评论成功',
                //   content: '您的评论已发送成功，请稍等片刻即可查看！',
                //   showCancel:false
                // })

                let post = this.data.post;
                let userIdList = [post.user_id]
                if(post.comments){
                  post.comments.forEach((comment) => {
                    let user = comment.user_id
                    if(userIdList.indexOf(user) === -1) userIdList.push(user);
                  })
                }
                console.log(userIdList)
              sendPushNotification(userIdList, post.content.slice(0,20), text, post.post_id)

            },
            err => {
                showError(err);
            }
        );
    },

    confirmDeletePost: function() {
        const that = this;
        wx.showModal({
            title: "提示",
            content: "确定要删除这篇动态？",
            success(res) {
                if (res.confirm) {
                  that.removePost(that.data.post_id, "post", that.data.post.user_id);
                }
            }
        });
    },

    confirmDeleteComment: function(e) {
        const that = this;
        wx.showModal({
            title: "提示",
            content: "确定要删除这篇评论？",
            success(res) {
                if (res.confirm) {
                  that.removePost(e.currentTarget.dataset.id, "comment", e.currentTarget.dataset.user);
                }
            }
        });
    },

    //Comment Modal popup actions
    showModalAndClear: function() {
        if (getApp().globalData.userInfo == null) {
            this.pleaseLogin();
            return;
        }
        this.setData({
            showModal: true,
            replyto: ""
        });
    },

    showModal: function() {
        this.setData({ showModal: true });
    },

    hideModal: function() {
        this.setData({ showModal: false });
    },

    reply: function(e) {
        if (getApp().globalData.userInfo == null) {
            this.pleaseLogin();
            return;
        }
        this.setData({
            replyto: `回复 ${e.currentTarget.dataset.name}: `,
            showModal: true
        });
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

    goToHome: function() {
        wx.switchTab({ url: "/pages/index/index" });
    },

    goToProfile: function(e) {
      wx.navigateTo({ url: `/pages/web/web?url=https%3A%2F%2Fapi.jhucssa.com%2Fpost%2Fprofile.php%3Fremoteid%3D${e.currentTarget.dataset.id}%26id%3D%23%23ifanrid%23%23` });
    },

    goToCopy: function(){
      let that = this
      wx.setClipboardData({
        data: that.data.post.contact,
      })
    },

    

    toClipboard: function(e) {
        wx.setClipboardData({
            data: e.currentTarget.dataset.content,
            success: function(_res) {
                wx.showToast({
                    title: "复制成功",
                    icon: "success",
                    duration: 1000
                });
            }
        });
    }
});
