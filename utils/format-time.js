const padLeftWithZero = n => {
    n = n.toString();
    return n[1] ? n : "0" + n;
};

const dateSeparator = "/";

const formatDate = ({ year, month, day }) =>
    [year, month, day].map(padLeftWithZero).join(dateSeparator);

const timeSeparator = ":";

const formatTime = ({ hour, minute, second }) =>
    [hour, minute, second].map(padLeftWithZero).join(timeSeparator);

const formatDateTime = ({ year, month, day, hour, minute, second }) =>
    formatDate({ year, month, day }) +
    " " +
    formatTime({ hour, minute, second });

const moment = require('moment.min.js');


function getDateFromTimestamp(timestamp, getExactTime){
  let timeDiff = Math.floor(Date.now() / 1000) - timestamp;
  let time = 0;
  if (timeDiff > 7776000 || getExactTime){
    time = moment(timestamp * 1000).format('YYYY-MM-DD HH:mm');
  }else{
    time = moment(timestamp * 1000).startOf('second').fromNow();
  }
  
  return time
}


function getDay(){
    var date = new Date()
    var day = date.getDay()
    var dayString;
    switch (day) {
      case 0: dayString = "星期日"; break;
      case 1: dayString = "星期一"; break;
      case 2: dayString = "星期二"; break;
      case 3: dayString = "星期三"; break;
      case 4: dayString = "星期四"; break;
      case 5: dayString = "星期五"; break;
      case 6: dayString = "星期六"; break;
      default: dayString = "";
    }
    return dayString;
}

const getTodayDate = () => {
  var date = new Date()
  var today = `${date.getMonth() + 1}月${date.getDate()}日 ${getDay()}`;
  return today;
}

const getCurrentTime = () => {
  var today = new Date();
  var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date + ' ' + time;
  return dateTime;
}


module.exports = {
  padLeftWithZero,
  formatTime,
  formatDate,
  formatDateTime,
  getTodayDate,
  getDateFromTimestamp,
  getCurrentTime
};