const axios = require("axios");
const querystring = require("querystring");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

// Replace with your own values
const CLIENT_ID = process.env.CLIENT_ID || "";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "";
const REFRESH_TOKEN = process.env.REFRESH_TOKEN || "";

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error(
    "Please provide CLIENT_ID, CLIENT_SECRET and REFRESH_TOKEN in .env"
  );
  process.exit(1);
}

// Function to get a new access token using the refresh token
async function getAccessToken() {
  const tokenUrl = "https://accounts.spotify.com/api/token";
  const tokenData = querystring.stringify({
    grant_type: "refresh_token",
    refresh_token: REFRESH_TOKEN,
  });

  const tokenHeaders = {
    Authorization:
      "Basic " +
      Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const response = await axios.post(tokenUrl, tokenData, {
    headers: tokenHeaders,
  });
  return response.data.access_token;
}

// Function to get now playing data
async function getNowPlaying() {
  try {
    const accessToken = await getAccessToken();

    const nowPlayingUrl =
      "https://api.spotify.com/v1/me/player/currently-playing";
    const nowPlayingHeaders = {
      Authorization: `Bearer ${accessToken}`,
    };

    const response = await axios.get(nowPlayingUrl, {
      headers: nowPlayingHeaders,
    });

    if (response.status === 204 || !response.data) {
        const data = fs.readFileSync("spotify.json");
        const jsonData = JSON.parse(data);
        return {
          isPlaying: false,
          ...jsonData,
        };
    } else {
      const nowPlayingData = response.data;

      //defined duration and progress
      let duration = nowPlayingData.item.duration_ms;
      let progress = nowPlayingData.progress_ms;

      //convert duration and progress to minutes and seconds
      let durationInMinutes = Math.floor(duration / 60000);
      let durationInSeconds = ((duration % 60000) / 1000).toFixed(0);
      let progressInMinutes = Math.floor(progress / 60000);
      let progressInSeconds = ((progress % 60000) / 1000).toFixed(0);

      //add leading zero if seconds < 10
      if (durationInSeconds < 10) {
        durationInSeconds = "0" + durationInSeconds;
      }
      if (progressInSeconds < 10) {
        progressInSeconds = "0" + progressInSeconds;
      }

      const isPlaying = nowPlayingData.is_playing;

      const proceedData = {
        title: nowPlayingData.item.name,
        artist: nowPlayingData.item.artists
          .map((artist) => artist.name)
          .join(", "),
        album: nowPlayingData.item.album.name,
        songThumbnail: nowPlayingData.item.album.images[0].url,
        songUrl: nowPlayingData.item.external_urls.spotify,
        duration: `${durationInMinutes}:${durationInSeconds}`,
        progress: `${progressInMinutes}:${progressInSeconds}`
      };

      //write the data to json file if is_playing is true
      if (isPlaying) {
        fs.writeFileSync("spotify.json", JSON.stringify(proceedData, null, 2));
        console.log("Data saved to spotify.json");
      }

      //read data from json file and return it
      try {
        const data = fs.readFileSync("spotify.json");
        const jsonData = JSON.parse(data);
        return {
          isPlaying,
          ...jsonData,
        };
      } catch (fileError) {
        console.error("Error reading or parsing spotify.json:", fileError.message);
        return { isPlaying };
      }
    }
  } catch (error) {
    console.error("Error getting now playing data:", error.message);
    return { isPlaying: false };
  }
}

module.exports = { getNowPlaying };
