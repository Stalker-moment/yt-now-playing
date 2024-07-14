const fs = require("fs");

const filePath = "./data.json";
let previousDuration = null;

async function sendLogSpotify() {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const dataJson = JSON.parse(data);
    return JSON.stringify(dataJson, null, 2);

  } catch (error) {
    console.error("Error processing log data:", error.message);
    return JSON.stringify({ error: error.message }, null, 2);
  }
}

module.exports = sendLogSpotify;
