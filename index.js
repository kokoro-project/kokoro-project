const axios = require('axios');

const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);
async function getChatGPTResponse(userText) {
  try {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: userText }],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );

    return res.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('ChatGPT error:', error.response?.data || error.message);
    return 'すみません、ちょっと調子が悪いみたいです。';
  }
}

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userText = event.message.text;
  const replyText = await getChatGPTResponse(event.message.text);

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: replyText,
  });
}
