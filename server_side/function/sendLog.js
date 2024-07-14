const fs = require("fs");

const filePath = "./data.json";
let previousDuration = null;
let falseCounter = 0;

async function sendLog() {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const dataJson = JSON.parse(data);

    // extract progress from duration
    let progressData = dataJson.duration.split(" / ");
    let progress = progressData[0].split(":");
    let progressMinutes = parseInt(progress[0], 10);
    let progressSeconds = parseInt(progress[1], 10);

    // combine minutes and seconds to a single value for comparison
    let currentProgress = progressMinutes * 60 + progressSeconds;

    const isPlaying = currentProgress !== previousDuration;
    previousDuration = currentProgress;

    if (!isPlaying) {
      falseCounter += 1;
    } else {
      falseCounter = 0;
    }

    if (falseCounter >= 2) {
      dataJson.isPlaying = false;
    } else {
      dataJson.isPlaying = isPlaying;
    }

    // write the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(dataJson, null, 2));
    console.log("Data updated in data.json");

    return JSON.stringify(dataJson, null, 2);

  } catch (error) {
    console.error("Error processing log data:", error.message);
    return JSON.stringify({ error: error.message }, null, 2);
  }
}

module.exports = sendLog;
