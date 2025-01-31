const Express = require("express");
const app = Express();
const cors = require("cors");
const OpenAI = require('openai');

const axios = require('axios');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // Храним файл в памяти
const { Blob } = require('buffer'); // Используем Blob из buffer
// const bodyParser = require('body-parser');


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

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token || token !== TOKEN ) return res.sendStatus(403);
    next();
  } catch (err) {
    console.log(err.message);
    return res.sendStatus(400);
  }
}

app.use(authenticateToken);

// Base URL for OpenAI API
const BASE_URL = 'https://api.openai.com/v1';
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${OPENAIKEY}`,
    'OpenAI-Beta': 'assistants=v2',
    'Content-Type': 'application/json'
  }
});

app.listen(PORT, HOST, () => {
  console.log("Server Listening on PORT:", PORT);
});

async function queryOpenai(query) {
  const chatCompletion = await openai.chat.completions.create(query);
  console.dir(chatCompletion, { depth: null, colors: true });
  return chatCompletion;
}

app.post('/openai/ask', async function (req, res) {
  console.log('/openai/ask', req.body);
  try {
    if (!openai) throw new Error('openai not ready');
    const requestData = req.body;
    if (requestData.token !== TOKEN) throw new Error('auth error');
    const openaiReply = await queryOpenai(requestData.query);
    res.send(openaiReply);
  } catch (err) {
    console.error(err.message)
    res.send({ error: 'server error', message: err.message || 'unknown' });
  }
});

app.post('/v1/chat/completions', async function (req, res) {
  console.log('/v1/chat/completions', req.body);
  try {
    const openaiReply = await apiClient.post('/chat/completions', req.body);
    console.dir(openaiReply.data, { depth: null, colors: true });
    res.status(openaiReply.status).json(openaiReply.data);
  } catch (err) {
    console.error(err.message)
    res.send({ error: 'server error', message: err.message || 'unknown' });
  }
});

// Proxy endpoint to create a new thread
app.post('/proxy/threads', async (req, res) => {
  console.log('/proxy/threads', req.body);
  try {
    const response = await apiClient.post('/threads', req.body, {
      headers: {
        'Authorization': `Bearer ${OPENAIKEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json',
      },
    });
    console.dir(response.data, { depth: null, colors: true });
    res.status(response.status).json(response.data);
  } catch (error) {
    handleError(res, error);
  }
});

// files
app.post('/proxy/files', upload.single('file'), async (req, res) => {
  console.log('/proxy/files', req.body);
try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const formData = new FormData();
    const fileBlob = new Blob([req.file.buffer], { type: req.file.mimetype }); // Преобразуем Buffer в Blob

    formData.append('file', fileBlob, req.file.originalname);
    formData.append('purpose', 'assistants');

    const response = await apiClient.post(`/files`, {
      headers: {
        'Authorization': `Bearer ${OPENAIKEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'multipart/form-data'
      },
    }, formData);

    res.status(response.status).json(response.data);
  } catch (error) {
    handleError(res, error);
  }
});

// Proxy endpoint to attach an image to a thread
app.post('/proxy/threads/:threadId/messages', async (req, res) => {
  console.log('/proxy/threads/:threadId/messages', req.body);
  try {
    const { threadId } = req.params;
    const response = await apiClient.post(`/threads/${threadId}/messages`, req.body, {
      headers: {
        'Authorization': `Bearer ${OPENAIKEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json',
      },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    handleError(res, error);
  }
});

// Proxy endpoint to run a thread
app.post('/proxy/threads/:threadId/runs', async (req, res) => {
  console.log('/proxy/threads/:threadId/runs', req.body);
  try {
    const { threadId } = req.params;
    const response = await apiClient.post(`/threads/${threadId}/runs`, req.body, {
      headers: {
        'Authorization': `Bearer ${OPENAIKEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json',
      },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    handleError(res, error);
  }
});

// Proxy endpoint to get the status of a thread run
app.get('/proxy/threads/:threadId/runs/:runId', async (req, res) => {
  console.log('/proxy/threads/:threadId/runs/:runId', req.body);
  try {
    const { threadId, runId } = req.params;
    const response = await apiClient.get(`/threads/${threadId}/runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${OPENAIKEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json',
      },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    handleError(res, error);
  }
});

// Proxy endpoint to get the result of a thread
app.get('/proxy/threads/:threadId/messages', async (req, res) => {
  console.log('/proxy/threads/:threadId/messages', req.body);
  try {
    const { threadId } = req.params;
    const response = await apiClient.get(`/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${OPENAIKEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json',
      },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    handleError(res, error);
  }
});

// Error handling function
function handleError(res, error) {
  if (error.response) {
    res.status(error.response.status).json(error.response.data);
  } else {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

