require('dotenv').config();
const express = require('express');
const axios = require('axios');
const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);
const app = express();
app.use(express.json());
app.use(line.middleware(config));

app.post('/webhook', async (req, res) => {
  const events = req.body.events;
  const results = await Promise.all(events.map(handleEvent));
  res.json(results);
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;
  const geminiResponse = await getGeminiResponse(userMessage);

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: geminiResponse,
  });
}

async function getGeminiResponse(userText) {
  try {
    const res = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{ parts: [{ text: userText }] }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        }
      }
    );
    return res.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini error:', error.response?.data || error.message);
    return 'Geminiからの応答が取得できませんでした。';
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
