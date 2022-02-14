import {
  showError
} from "../../app/common-functions.js";
import {
  submitPost,
  getSpaces
} from "../../app/feed-actions.js";
import {
  logger
} from "../../app/core-functions.js";

Page({
  data: {
    height: 20,
    focus: false,
    addbutton: getApp().globalData.imgDomain + "add-img.jpg",
    images: [],
    loading: false,
    canAdd: true,
    description: "",
    space_id: 0,
    current_nav: 0,
    space_array: null || wx.getStorageSync("navs"),
    uploading:0,
    link: ""
  },

  bindMsg: function(){
    //subscribe message
    let form_id = "mpvsTVURqrmbRs4L0NTpju0EJzIndV3pkLxkLgo7Trw"

    wx.requestSubscribeMessage({
      tmplIds: [form_id],
      success: (res) => {
        logger("post", "subscribe-message-accepted", form_id);
        let subscription = []
        if (res[form_id] === 'accept') {
          subscription.push({
            template_id: form_id,
            subscription_type: 'once',
          })
        }
        wx.BaaS.subscribeMessage({ subscription }).then(res => {
          // success
        }, err => {
          // fail
        })
      },
      fail: (err) => {
        console.log("rejected!!")
        logger("post", "subscribe-message-rejected", form_id);
      }
    })
        //subscribe message end
  },

  bindFormSubmit(e) {
    let formID = e.detail.formId
    // wx.BaaS.wxReportTicket(formID).then(res => {
    //   console.log("form tickect success " + formID)
    //   logger("form", "form-collected", formID);
    // }, err => {
    //   logger("form", "form-collect-failed", formID);
    // })

    console.log(e.detail.value.textarea);
    if (e.detail.value.textarea !== "") {

      this.submitPost(e.detail.value.textarea, e.detail.value.title, e.detail.value.contact,
        e.detail.value.override_username,  e.detail.value.url );
    } else {
      wx.showToast({
        title: "写点什么吧",
        icon: "none",
        duration: 1500
      });
    }
  },

  getSpaces: function() {
    const thisPage = this;

    getSpaces().then(
      res => {
        thisPage.setData({
          space_array: [{
            name: "全部动态",
            id: 0
          }].concat(res.data),
        });
        wx.setStorageSync("navs", this.data.space_array);
        thisPage.updatePicker()
      },
      _err => {
        showError();
      }
    );
  },

  pleaseLogin: function() {
    wx.switchTab({
      url: '/pages/index/index',
    })
    wx.showModal({
      title: "提示",
      content: "您必须要登录才能够发布动态，现在就登录？",
      success(res) {
        if (res.confirm) {
          wx.switchTab({
            url: "/pages/me/me"
          });
        }
      }
    });
  },

  submitPost: function (text, title, contact, override_username, url) {
    if (!getApp().globalData.userInfo) {
      this.pleaseLogin()
      return;
    }

    wx.showToast({
      title: "请稍等...",
      icon: "loading",
      mask: true,
      duration: 10000
    });

    submitPost(
      getApp().globalData.ifanrID,
      text,
      title,
      contact,
      this.data.space_id,
      this.data.images.join(","),
      override_username,
      url
    ).then(
      _res2 => {
        getApp().globalData.needFeedRefresh = true;
        wx.navigateBack({
          changed: true
        });
        wx.switchTab({
          url: '/pages/discover/discover',
        })
        wx.showToast({
            title: "发布成功!",
            duration: 2000
        });

        // wx.showModal({
        //   title: '发布成功',
        //   content: '您的动态已发送成功，稍等片刻即可查看！',
        //   showCancel: false
        // })
      },
      err => {
        showError(err);
        this.setData({
          loading: false
        });

      }
    );
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    if (options.space_id) {
      this.setData({
        space_id: options.space_id,
      });
    }

    if (options.content) {
      this.setData({
        textareaValue: replaceAll(options.content,"\\\\n",'\n'),
      });
    }

    if (!getApp().globalData.ifanrID) {
      this.pleaseLogin()
    }

    getApp().userInfoNotReadyCallback = res => {
      this.pleaseLogin()
    };

    setTimeout(() => {
      if (!getApp().globalData.userInfo) {
        this.pleaseLogin()
      }
    }, 3000)

    if (getApp().globalData.isAdmin) {
      this.setData({
        isAdmin: getApp().globalData.isAdmin
      })
    }

    this.getSpaces()
    this.updatePicker()
  },
  
  updatePicker: function() {
    if (this.data.space_array[0]) {
      this.setData({
        name_array: this.data.space_array.map(a => a.name),
        current_nav: this.data.space_array.findIndex(a => a.id == this.data.space_id)
      });
    }
    this.bindPickerChange({ detail: { value: this.data.current_nav}})
  },

  addImage: function() {
    this.setData({
      canAdd: this.data.images.length < 15
    });

    const thisPage = this;
    wx.chooseImage({
      count: 9,
      success: function(res) {
        thisPage.setData({
          loading: false
        });
        const MyFile = new wx.BaaS.File();
        const metaData = {
          categoryName: "SDK"
        };
        res.tempFilePaths.forEach(image => {
          thisPage.setData({
            loading: false,
            uploading: thisPage.data.uploading + 1
          });

          MyFile.upload({
            filePath: image
          }, metaData).then(
            res => {
              const data = res.data.path; // res.data 为 Object 类型
              console.log(res.data);
              let imageTemp = thisPage.data.images;

              thisPage.setData({
                loading: false,
                uploading: thisPage.data.uploading - 1
              });


              wx.BaaS.wxCensorImage( res.data.file.id).then(
                res => {

                  console.log(res)
                  if (res && res.data && res.data.data && res.data.data.risky) {
                    console.log("图片违规：" + res.data.data.risky)
                    wx.showToast({
                      title: "有一张照片违规未加入",
                      icon: 'none',
                      duration: 3000
                    });
                    logger("post", "image-illegal", data);

                  } else {
                    imageTemp = thisPage.data.images;
                    thisPage.setData({
                      images: imageTemp.concat(data)
                    });
                    logger("post", "image-added", data);

                  }

                },
                err =>{
                  imageTemp = thisPage.data.images;
                  thisPage.setData({
                    images: imageTemp.concat(data),
                  });
                  logger("post", "image-added-without-checker", data);
                }
              );



               
            

          
            },
            err => {
              console.log(err);
              thisPage.showError("添加失败");
              logger("post", "image-add-failed", err);
              // HError 对象
            }
          );
        })
      }
    });
  },
  goToImage: function(e) {
    // const { url } = e.currentTarget.dataset;
    // const urlSet = this.data.images;
    // wx.previewImage({
    //     current: url,
    //     urls: urlSet
    // });
    const that = this
    wx.showActionSheet({
      itemList: ['查看', '删除'],
      success: function(tap) {
      const {url} = e.currentTarget.dataset;
      const urlSet = that.data.images;
        console.log(tap)
        if (tap.tapIndex === 0) {
          wx.previewImage({
            current: url,
            urls: urlSet
          })
        }else if(tap.tapIndex===1){
          console.log(that.data.images)
          let newimages = that.data.images
          newimages.splice(newimages.indexOf(url), 1)
          that.setData({
            images:newimages
          })
        }
      },
      fail: function(err) {
        console.log(err.errMsg)
      }
    })
  },


  goToWeb: function () {
    console.log(this.data.link)
    if(this.data.link){
      let that = this
      wx.navigateTo({ url: `/pages/web/web?url=${that.data.link}` });
    }
  },


  processing: function() {
    wx.showToast({
      title: "图片压缩中...",
      icon: "loading",
      mask: true,
      duration: 2000
    });
  },

  bindPickerChange: function(e) {
    if (!this.data.space_array[0]){ return }
    console.log("picker发送选择改变，携带值为", e.detail.value);
    this.setData({
      space_id: this.data.space_array[e.detail.value].id,
      market: this.data.space_array[e.detail.value].market || false,
      description: this.data.space_array[e.detail.value].description || "",
      link: this.data.space_array[e.detail.value].link || null,
      current_nav: e.detail.value
    });
  }
});
function replaceAll(str, find, replace) {

  return str.replace(new RegExp(find, 'g'), replace);
}