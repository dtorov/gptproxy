const Express = require("express");
const app = Express();
const cors = require("cors");
const OpenAI = require('openai');

const PORT = process.env.PORT || '3000';
const HOST = process.env.HOST || '127.0.0.1';
const TOKEN = process.env.TOKEN || Date.now();
const OPENAIKEY = process.env.OPENAIKEY || Date.now();


console.log('process.env', process.env);

let openai = new OpenAI({
  apiKey: OPENAIKEY
});

app.use(cors());
app.use(Express.json());

app.listen(PORT, HOST, () => {
    console.log("Server Listening on PORT:", PORT);
    openAiInit(req.body.openaiApiKey);
  });

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