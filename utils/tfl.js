import { request, logger } from "../app/core-functions.js"

export function getTubeStatus() {
  return new Promise((resolve, reject) => {

    request("tfl", { action:"tubeStatus"}).then(
      res => {
        console.log(res.data)
        resolve(res.data.lines);
      },
      err => {
        logger("tfl","get-tfl-fail", null, true)
        console.log(err);
        reject(err);
      }
    );
  });
}


export function getTubeColour(lineIndex){
  //ref https://oobrien.com/2012/01/tube-colours/
  let colours = ["#B36305", "#E32017", "#FFD300", "#00782A", "#F3A9BB", "#A0A5A9", "#9B0056", "#000000", "#003688", "#0098D4", "#95CDBA", "#00A4A7"]

  return colours
}