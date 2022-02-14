import {request, logger} from "core-functions.js"
import { getDateFromTimestamp, getCurrentTime } from "../utils/format-time.js"

export function getFeeds(userid, postAfterDate, singlePostId, currentSpace) {
  
    let parameters = `userid=${userid?userid:""}`;

    if (singlePostId) {
      parameters += `&singlePostId=${singlePostId}`;
    }
    if (currentSpace && currentSpace !== 0) {
        parameters += `&space=${currentSpace}`;
    }
    if (postAfterDate) {
        parameters += `&afterDate=${encodeURIComponent(postAfterDate)}`;
    }

    console.log(parameters);

    return new Promise((resolve, reject) => {
        

        request("get", {
            action: "getPost",
            content: parameters,
            user: getApp().globalData.ifanrID,
        }).then(
            res => {
                const result = res;
                // if (result.code == 0) {
                    const resource = res.data;
                    console.log(resource);

                    if (!resource.posts) {
                        logger("feed","empty-get-post",null,true)
                        resolve([]);
                        return;
                    }

                    //convert unix time
                    resource.posts.forEach( (post) => {
                      let exactTime = (singlePostId != null)
                      //get exact time when post detail is shown
                      post.time = getDateFromTimestamp(post.time, exactTime)
                      post.created_at = getDateFromTimestamp(post.created_at, exactTime)

                      if (post.comments) {
                        post.comments.forEach((comment) => {
                          comment.time = getDateFromTimestamp(comment.time, false)
                        })
                      }

                    })


                    logger("feed","get-post-success", `after time ${postAfterDate}, id ${singlePostId}, at space ${currentSpace}`)
                    resolve(resource);
            },
            err => {
                logger("feed","get-post-fail", `after time ${postAfterDate}, id ${singlePostId}, at space ${currentSpace}`, true)
                console.log(err);
                reject(err);
            }
        );
    });
}

export function getSpaces() {
    return new Promise((resolve, reject) => {
        request("get", {
            action: "spaces",
            user: getApp().globalData.ifanrID,
        }).then(
            res => {
                console.log(res);
                if (res.data) {
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


export function getPostOptions() {
    return new Promise((resolve, reject) => {
        request("get", {
            action: "postOptions",
            user: getApp().globalData.ifanrID,
        }).then(
            res => {
                console.log(res);
                if (res.data) {
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

export function likePost(userid, postId) {
    return new Promise((resolve, reject) => {
        request("post", {
            action: "like",
            content: `{
                  "postid": ${postId},
                  "userid": ${userid}
                }`,
            user: getApp().globalData.ifanrID,
        }).then(
            res => {
                logger("like","like", postId)
                resolve(res);
            },
            err => {
                logger("like","like-failed", postId, true)
                console.log(err);
                reject(err);
            }
        );
    });
}

export function submitPost(_userid, text, title, contact, spaceId, images, override_username, url) {
    return new Promise((resolve, reject) => {
        text = text.replace(/\n/gu, "\\n").replace(/"/g, '\\\"');
        title = title.replace(/"/g, '\\\"');
        wx.BaaS.wxCensorText(title + " - " + text + " - " + contact).then(res => {
          console.log("违规："+res.data.risky)
          if (res.data.risky){
            logger("post", "post-illegal", title + " - " + text, true)
            reject("发布失败，您的文本包含违规内容");
          }else{


            //审核通过，继续发帖
            request("post", {
              action: "post",
              content: `{
                  "message": "${text}",
                  "title": "${title}",
                  "contact": "${contact}",
                  "userid": ${getApp().globalData.ifanrID},
                  "space": ${spaceId},
                  "images": "${images}",
                  "override_username": "${override_username}",
                  "link": "${url}"
                }`,
              user: getApp().globalData.ifanrID,
            }).then(
              res => {
                console.log(res.data)
                if (res.data !== "ok") {
                  logger("post", "post-fail", text, true)
                  reject("发布失败，请检查是否包含特殊字符");
                } else {
                  logger("post", "post", text)
                  wx.BaaS.invoke("newPostEmail", {
                    user: _userid,
                    title: title,
                    content: text
                  })
                  resolve(res);
                }
              },
              err => {
                logger("post", "post-fail", text, true)
                console.log(err);
                reject("发布失败，网络异常");
              }
            );


          }
        }, err => {
          // HError 对象
        })
        
    });
}

export function submitComment(userid, commentText, postId) {
    return new Promise((resolve, reject) => {
        commentText = commentText.replace(/\n/gu, "\\n").replace(/"/g, '\\\"');
        wx.BaaS.wxCensorText(commentText).then(res => {
          console.log("违规："+res.data.risky)
          if (res.data.risky){
            logger("post", "comment-illegal", commentText, true)
            reject("发布失败，您的文本包含违规内容");
          }else{


            //审核通过，继续发帖
            request("post", {
              action: "post",
              content: `{
                  "message": "${commentText}",
                  "userid": ${userid},
                  "postid": ${postId},
                  "iscomment": "true"
                }`,
              user: getApp().globalData.ifanrID,
            }).then(
              res => {
                console.log(res);

                if (res.data !== "ok") {
                  logger("post", "comment-failed", postId, true)
                  reject("评论失败，请检查是否包含特殊字符");
                } else {
                  logger("post", "comment", postId);
                  wx.BaaS.invoke("newPostEmail", {
                    user: getApp().globalData.ifanrID,
                    title: "【评论】" + postId,
                    content: commentText
                  })
                  resolve(res);
                }
              },
              err => {
                console.log(err);
                logger("post", "comment-failed", postId, true)
                reject("评论失败，网络异常");
              }
            );
            
          }
        }, err => {
          // HError 对象
        })
        
    });
}

export function sendPushNotification(targetUserIdList, postTitle, replyContent, postid){
  wx.BaaS.invoke("pushNotification", {
    targetUserIdList: targetUserIdList,
    title: postTitle,
    comment: replyContent,
    replyUserName: getApp().globalData.userInfo.nickName,
    replyTime: getCurrentTime(),
    page: "pages/moments/detail?id="+postid
  }).then(
    res => {
      logger("notification","notification-sent", postTitle)
      console.log(res.data);
      
    },
    err => {
      logger("notification","notification-send-failed", postTitle, true)
      console.log(err);
    }
  );
}


export function removeTarget(userid, targetId, targetType) {
    return new Promise((resolve, reject) => {
        request("post", {
            action: "remove",
            content: `{
                    "id": "${targetId}",
                    "userid": ${userid},
                    "type": "${targetType}"
                  }`,
            user: getApp().globalData.ifanrID,
        }).then(
            res => {
                console.log(res);

                if (res.data === "ok") {
                    logger("remove",targetType + "-removed", targetId)
                    resolve(res);
                } else {
                    logger("remove",targetType + "-remove-failed", targetId, true)
                    reject();
                }
            },
            err => {
                console.log(err);
                reject(err);
            }
        );
    });
}
