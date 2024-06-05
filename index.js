const Express = require("express");
const app = Express();
const cors = require("cors");
const OpenAI = require('openai');

const { host, port, token, openaiBotboomApiKey } = require("./config");
console.log('process.env', process.env);
const PORT = process.env.PORT || port;
const HOST = process.env.HOST || host;
const Token = process.env.TOKEN || token;
const openai = new OpenAI({
    //apiKey: process.env['org-BNZkupLCFdvPqKGitiaSTFog'], // This is the default and can be omitted
    apiKey: process.env.ApiKey || openaiBotboomApiKey
  });

app.use(cors());
app.use(Express.json());

app.listen(PORT, HOST || '127.0.0.1', () => {
    console.log("Server Listening on PORT:", port);
  });

async function queryOpenai(query) {
/*
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'gpt-3.5-turbo',
  });
*/
    const chatCompletion = await openai.chat.completions.create(query);
    console.dir(chatCompletion, { depth: null , colors: true});
    return chatCompletion;
}

app.post('/ask', async function (req, res) {
    try {
        const requestData = req.body;
        if(requestData.token !== Token) {
            res.send({error: 'auth error'});
            return true;
        }
        console.dir(requestData, { depth: null , colors: true});
        const openaiQuery = requestData.query;
        const openaiReply = await queryOpenai(openaiQuery);

        res.send({openaiReply});
    } catch(err) {
        console.error(err.message)
        res.send({error: 'server error', message: err.message || 'unknown'});
    }

  });