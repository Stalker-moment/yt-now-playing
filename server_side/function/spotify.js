const axios = require('axios');
const querystring = require('querystring');
const dotenv = require('dotenv');

dotenv.config();

// Replace with your own values
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.REFRESH_TOKEN || '';

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.error('Please provide CLIENT_ID, CLIENT_SECRET and REFRESH_TOKEN in .env');
    process.exit(1);
}

// Function to get a new access token using the refresh token
async function getAccessToken() {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const tokenData = querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: REFRESH_TOKEN,
    });

    const tokenHeaders = {
        Authorization: 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    const response = await axios.post(tokenUrl, tokenData, { headers: tokenHeaders });
    return response.data.access_token;
}

// Function to get now playing data
async function getNowPlaying() {
    try {
        const accessToken = await getAccessToken();

        const nowPlayingUrl = 'https://api.spotify.com/v1/me/player/currently-playing';
        const nowPlayingHeaders = {
            Authorization: `Bearer ${accessToken}`,
        };

        const response = await axios.get(nowPlayingUrl, { headers: nowPlayingHeaders });

        if (response.status === 204) {
            console.log('No track is currently playing.');
        } else {
            const nowPlayingData = response.data;
            console.log('Now Playing:', nowPlayingData);
        }
    } catch (error) {
        console.error('Error getting now playing data:', error.message);
    }
}

module.exports = getNowPlaying;