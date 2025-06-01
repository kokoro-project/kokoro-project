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

async function getGeminiResponse(userText) {
  try {
    const res = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        contents: [{ parts: [{ text: userText }] }]
      }
    );
    return res.data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error('Gemini error:', err.response?.data || err.message);
    return 'ごめん、AIから返事が取れなかったよ。';
  }
}

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const replyText = await getGeminiResponse(event.message.text);
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: replyText,
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
