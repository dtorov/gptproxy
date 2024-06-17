const Express = require("express");
const app = Express();
const cors = require("cors");
const OpenAI = require('openai');

const PORT = process.env.PORT || '3000';
const HOST = process.env.HOST || '127.0.0.1';
const TOKEN = process.env.TOKEN || Date.now();


console.log('process.env', process.env);

let openai;

app.use(cors());
app.use(Express.json());

app.listen(PORT, HOST, () => {
    console.log("Server Listening on PORT:", PORT);
  });

async function openAiInit(openaiApiKey) {
  openai = new OpenAI({
    apiKey: openaiApiKey
  });
}

app.post('/openai/init', async function (req, res) {
  try {
    if(req.body.token !== TOKEN) {
      console.log('/openai/init', req.body, TOKEN)
      throw new Error('auth error');
    }
    if(req.body.openaiApiKey) {
      await openAiInit(req.body.openaiApiKey);
      res.send({})
    }
    throw new Error('openaiApiKey error');
  } catch(err) {
    console.error(err);
    res.send({error: 'server error', message: err.message || 'unknown'});
  }
})

async function queryOpenai(query) {
      const chatCompletion = await openai.chat.completions.create(query);
      console.dir(chatCompletion, { depth: null , colors: true});
      return chatCompletion;
  }

app.post('/openai/ask', async function (req, res) {
    try {
      if(!openai) throw new Error('openai not ready');
      const requestData = req.body;
      if(requestData.token !== TOKEN) throw new Error('auth error');
      const openaiReply = await queryOpenai(requestData.query);
      res.send(openaiReply);
    } catch(err) {
        console.error(err.message)
        res.send({error: 'server error', message: err.message || 'unknown'});
    }

  });