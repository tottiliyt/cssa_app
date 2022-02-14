import { request, logger } from "../app/core-functions.js"

export function getWeather() {
  return new Promise((resolve, reject) => {

    request("weather").then(
      res => {
        const resource = res.data.list[0];
        console.log("--------weather---------")
        console.log(resource);
        let weather = `Baltimore 今天天气${resource.weather[0].description}，最高${Math.floor(resource.main.temp_max)}度，最低${Math.floor(resource.main.temp_min)}度，湿度${resource.main.humidity}%`

        resolve(weather);
      },
      err => {
        logger("weather","get-weather-fail", null, true)
        console.log(err);
        reject(err);
      }
    );
  });
}
