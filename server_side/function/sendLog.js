const fs = require("fs");

const filePath = "./data.json";
let previousDuration = null;
let falseCounter = 0;
const THRESHOLD = 10; // Number of consecutive false readings before setting isPlaying to false

async function sendLog() {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const dataJson = JSON.parse(data);

    // Extract progress from duration
    let progressData = dataJson.duration.split(" / ");
    let progress = progressData[0].split(":");
    let progressMinutes = parseInt(progress[0], 10);
    let progressSeconds = parseInt(progress[1], 10);

    // Combine minutes and seconds to a single value for comparison
    let currentProgress = progressMinutes * 60 + progressSeconds;

    // Determine if playback is ongoing
    const isPlaying = currentProgress !== previousDuration;

    // Log current and previous durations for debugging
    console.log(
      `Current Progress: ${currentProgress}, Previous Progress: ${previousDuration}, Is Playing: ${isPlaying}`
    );

    // Update false counter based on isPlaying state
    if (!isPlaying) {
      falseCounter += 1;
    } else {
      falseCounter = 0; // Reset counter if playback is detected
    }

    previousDuration = currentProgress;

    // Only write false to JSON if falseCounter reaches the threshold
    if (falseCounter >= THRESHOLD) {
      if (dataJson.isPlaying !== false) {
        dataJson.isPlaying = false;
        fs.writeFileSync(filePath, JSON.stringify(dataJson, null, 2));
        console.log("Data updated in data.json to false");
      }
    } else if (isPlaying) {
      // Update the JSON with the current state if it is playing
      if (dataJson.isPlaying !== true) {
        dataJson.isPlaying = true;
        fs.writeFileSync(filePath, JSON.stringify(dataJson, null, 2));
        console.log("Data updated in data.json to true");
      }
    }

    return JSON.stringify(dataJson, null, 2);
  } catch (error) {
    console.error("Error processing log data:", error.message);
    return JSON.stringify({ error: error.message }, null, 2);
  }
}

module.exports = sendLog;
