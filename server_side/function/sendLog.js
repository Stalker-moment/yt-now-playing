const fs = require("fs");

const filePath = "./data.json";

async function sendLog(reverse) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const dataJson = JSON.parse(data);

    //extract duration progress
    let progressData = dataJson.duration.progress.split("/");
    let progress = progressData[0].split(":");

    const isPlaying = progress !== previousDuration;
    previousDuration = progress;

    if (isPlaying) {
      const stringifyData = JSON.stringify(dataJson, null, 2);
      return stringifyData;
    } else {
      //write the data to json file if is_playing is false
      fs.writeFileSync(filePath, JSON.stringify(dataJson, null, 2));
      const stringifyData = JSON.stringify(dataJson, null, 2);
      return stringifyData;
    }
    
  } catch (error) {
    return { error: error };
  }
}

module.exports = sendLog;
