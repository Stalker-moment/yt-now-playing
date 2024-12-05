// server.js
const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
const PORT = 8888;

// Spotify API credentials (add these to your .env file)
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:8888/callback'; // Match your redirect URI

// Scopes for authorization
const SCOPES = [
  'user-read-playback-position',
  'user-top-read',
  'user-read-recently-played',
  'user-read-currently-playing',
].join(' ');

// Step 1: Redirect user to Spotify's authorization page
app.get('/login', (req, res) => {
  const authURL = `https://accounts.spotify.com/authorize?${querystring.stringify({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
  })}`;
  res.redirect(authURL);
});

// Step 2: Handle callback and exchange authorization code for tokens
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  if (!code) {
    return res.status(400).send('Authorization code not provided!');
  }

  const tokenURL = 'https://accounts.spotify.com/api/token';

  const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  try {
    const response = await axios.post(
      tokenURL,
      querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token } = response.data;

    res.json({
      message: 'Tokens retrieved successfully!',
      access_token,
      refresh_token,
    });
  } catch (error) {
    console.error('Error exchanging code for tokens:', error.response?.data || error.message);
    res.status(500).send('Failed to retrieve tokens!');
  }
});

// Step 3: Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Login URL: http://localhost:${PORT}/login`);
});
