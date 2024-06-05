const Express = require("express");
const app = Express();
const cors = require("cors");
const OpenAI = require('openai');

const { port, token, openaiBotboomApiKey } = require("./config");
const PORT = process.env.PORT || port;
const Token = process.env.PORT || token;
const openai = new OpenAI({
    //apiKey: process.env['org-BNZkupLCFdvPqKGitiaSTFog'], // This is the default and can be omitted
    apiKey: process.env.PORT || openaiBotboomApiKey
  });

app.use(cors());
app.use(Express.json());

app.listen(PORT, () => {
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
    console.log(chatCompletion);
    return chatCompletion;
}

app.post('/ask', async function (req, res) {
    try {
        console.log(req.body);
        const requestData = req.body;
        if(requestData.token !== Token) {
            res.send({error: 'auth error'});
            return true;
        }
        const openaiQuery = requestData.query;
        const openaiReply = await queryOpenai(openaiQuery);

        res.send({openaiReply});
    } catch(err) {
        console.error(err.message)
        res.send({error: 'server error', message: err.message || 'unknown'});
    }

  });