const fs = require("fs");

const filePath = "./data.json";

async function sendLog(reverse) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const dataJson = JSON.parse(data);
    const stringifyData = JSON.stringify(dataJson, null, 2);
    return stringifyData;
  } catch (error) {
    return { error: error };
  }
}

module.exports = sendLog;
