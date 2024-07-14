const puppeteer = require("puppeteer-core");
const readline = require("readline");
const chalk = require("chalk");
const cfonts = require("cfonts");
const ytdl = require("ytdl-core");
const WebSocket = require("ws");

const clearConsole = () => {
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
};

let socket;
let lastValidSongData = null;

const connectWebSocket = () => {
  socket = new WebSocket("wss://nowapi.tierkun.my.id/send");

  socket.onopen = () => {
    console.log(chalk.green("WebSocket connection established."));
  };

  socket.onclose = (event) => {
    console.log(chalk.red("WebSocket connection closed. Attempting to reconnect..."));
    setTimeout(connectWebSocket, 5000); // Reconnect after 5 seconds
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
};

(async () => {
  const bravePath = "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";
  const userDataDir = "C:\\Users\\Acer\\AppData\\Local\\BraveSoftware\\Brave-Browser\\User Data\\";
  const checkInterval = 1300;

  connectWebSocket(); // Connect to WebSocket

  const browser = await puppeteer.launch({
    executablePath: bravePath,
    headless: false,
    userDataDir: userDataDir,
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto("https://music.youtube.com", { waitUntil: "networkidle2" });

  let previousDuration = null;
  let lastValidUrl = null;

  async function checkNowPlaying() {
    try {
      await page.waitForSelector(".ytmusic-player-bar");

      const nowPlaying = await page.evaluate(() => {
        const title = document.querySelector(".title.ytmusic-player-bar")?.innerText;
        let artist = document.querySelector(".byline.ytmusic-player-bar")?.innerText;
        const currentUrl = window.location.href;
        const thumbnail = document.querySelector(".ytmusic-player-bar img")?.src;
        const durationElement = document.querySelector(".time-info")?.innerText || document.querySelector(".time-info > span:nth-child(2)")?.innerText;

        // parse artist
        if (artist) {
          if (artist.includes("•")) {
            artist = artist.split("•")[0].trim();
            artist = artist.replace(/\n/g, ""); // delete enter
          }
        }

        let duration = null;
        if (durationElement) {
          const durationMatch = durationElement.match(/\d+:\d+(:\d+)? \/ \d+:\d+(:\d+)?/);
          if (durationMatch) {
            duration = durationMatch[0];
          }
        }

        return { title, artist, duration, currentUrl, thumbnail };
      });

      const arrayUrlNotValid = [
        "https://music.youtube.com/",
        "https://music.youtube.com/watch?v=undefined",
        "https://music.youtube.com/library",
        "https://music.youtube.com/playlist",
        "https://music.youtube.com/playlist?list=undefined",
        "https://music.youtube.com/playlist?list=WL",
        "https://music.youtube.com/playlist?list=RDAMVM",
        "https://music.youtube.com/explore",
        "https://music.youtube.com/artist",
        "https://music.youtube.com/artist/undefined",
        "https://music.youtube.com/artist/undefined/about",
        "https://music.youtube.com/artist/undefined/videos",
        "https://music.youtube.com/artist/undefined/albums",
        "https://music.youtube.com/artist/undefined/singles",
        "https://music.youtube.com/artist/undefined/related",
        "https://music.youtube.com/artist/undefined/featured",
        "https://music.youtube.com/artist/undefined/merch",
        "https://music.youtube.com/artist/undefined/community",
        "https://music.youtube.com/artist/undefined/events",
        "https://music.youtube.com/artist/undefined/gallery",
        "https://music.youtube.com/artist/undefined/about",
        "https://music.youtube.com/artist/undefined/videos",
        "https://music.youtube.com/artist/undefined/albums",
        "https://music.youtube.com/artist/undefined/singles",
        "https://music.youtube.com/artist/undefined/related",
        "https://music.youtube.com/artist/undefined/featured",
        "https://music.youtube.com/artist/undefined/merch",
        "https://music.youtube.com/artist/undefined/community",
        "https://music.youtube.com/artist/music_premium/musicfeed",
        "https://music.youtube.com/playlist?list="
      ];

      if (nowPlaying.currentUrl !== lastValidUrl && !arrayUrlNotValid.includes(nowPlaying.currentUrl)) {
        lastValidUrl = nowPlaying.currentUrl;
      }

      const isPlaying = nowPlaying.duration !== previousDuration;
      previousDuration = nowPlaying.duration;

      if (isPlaying && lastValidUrl && !lastValidUrl.includes("playlist?list=")) {
        const details = await ytdl.getBasicInfo(lastValidUrl);

        const jsonData = {
          title: nowPlaying.title,
          duration: nowPlaying.duration,
          url: lastValidUrl,
          thumbnail: nowPlaying.thumbnail,
          artist: nowPlaying.artist,
          channel: details.videoDetails.ownerChannelName,
          description: details.videoDetails.description,
          views: details.videoDetails.viewCount,
          channelUrl: details.videoDetails.ownerProfileUrl,
        };

        lastValidSongData = jsonData;

        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(jsonData));
        }

        clearConsole();
        cfonts.say("YT MUSIC PLAYING", {
          align: "center",
          font: "block",
          gradient: ["#00ff00", "#ff0000"],
          space: false,
        });
        console.log(chalk.green("---------Now Playing---------"));
        console.log(chalk.yellow(`Title: ${nowPlaying.title}`));
        console.log(chalk.cyan(`Channel: ${details.videoDetails.ownerChannelName}`));
        console.log(chalk.red(`Artist: ${nowPlaying.artist}`));
        console.log(chalk.white(`Views: ${details.videoDetails.viewCount}`));
        console.log(chalk.magenta(`Duration: ${nowPlaying.duration}`));
        console.log(chalk.white(`URL: ${lastValidUrl}`));
        console.log(chalk.gray(`Channel URL: ${details.videoDetails.ownerProfileUrl}`));
        console.log(chalk.blue(`Thumbnail: ${nowPlaying.thumbnail}`));
        console.log(chalk.green("----------------------------"));
      } else if (nowPlaying.currentUrl.includes("playlist?list=")) {
        if (lastValidSongData) {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(lastValidSongData));
          }

          clearConsole();
          cfonts.say("YT MUSIC PLAYING", {
            align: "center",
            font: "block",
            gradient: ["#00ff00", "#ff0000"],
            space: false,
          });
          console.log(chalk.green("---------Now Playing---------"));
          console.log(chalk.yellow(`Title: ${lastValidSongData.title}`));
          console.log(chalk.cyan(`Channel: ${lastValidSongData.channel}`));
          console.log(chalk.red(`Artist: ${lastValidSongData.artist}`));
          console.log(chalk.white(`Views: ${lastValidSongData.views}`));
          console.log(chalk.magenta(`Duration: ${lastValidSongData.duration}`));
          console.log(chalk.white(`URL: ${lastValidSongData.url}`));
          console.log(chalk.gray(`Channel URL: ${lastValidSongData.channelUrl}`));
          console.log(chalk.blue(`Thumbnail: ${lastValidSongData.thumbnail}`));
          console.log(chalk.green("----------------------------"));
        } else {
          clearConsole();
          console.log(chalk.red("No valid song data available."));
        }
      } else {
        clearConsole();
        console.log(chalk.red("No music is currently playing."));
      }
    } catch (error) {
      console.error("Error extracting now playing information:", error);
    }
  }

  await checkNowPlaying();
  setInterval(checkNowPlaying, checkInterval);

  process.on("SIGINT", async () => {
    console.log("Closing browser...");
    await browser.close();
    socket.close();
    process.exit();
  });
})();
