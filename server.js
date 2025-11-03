require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { adminOnly } = require('./auth');
const app = express();
app.use(express.json());

app.use(session({
	secret: process.env.SESSION_SECRET || 'a_secret_key',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: false } // Set to true if using HTTPS
}));

const FAQ_PATH = path.join(__dirname, 'faq_knowledge.json');
const FAQ = JSON.parse(fs.readFileSync(FAQ_PATH, 'utf8'));
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

function isAuthenticated(req, res, next) {
	if (req.session.isAuthenticated) {
		return next();
	}
	res.status(401).send('Unauthorized');
}

app.post('/login', (req, res) => {
	const { password } = req.body;
	if (password === process.env.ADMIN_PASSWORD) {
		req.session.isAuthenticated = true;
		res.json({ success: true });
	} else {
		res.status(401).json({ success: false });
	}
});

app.get('/logout', (req, res) => {
	req.session.destroy();
	res.redirect('/admin.html');
});

// Endpoint to save registration submissions
app.post('/submit', (req, res) => {
  const subPath = path.join(__dirname, 'submissions.json');
  const submission = req.body;
  submission.timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  let submissions = [];
  try {
    if (fs.existsSync(subPath)) {
      submissions = JSON.parse(fs.readFileSync(subPath, 'utf8'));
    }
  } catch (err) {}
  submissions.push(submission);
  fs.writeFileSync(subPath, JSON.stringify(submissions, null, 2));
  res.json({ success: true });
});

// Improved /ask endpoint: always returns an answer, even if not a perfect FAQ match
// Improved /ask endpoint: allow free model selection via ?model= param
app.post('/ask', async (req, res) => {
  const question = req.body.question || '';
  let model = req.query.model || req.body.model || 'gpt-4o-mini'; // allow override
  // Only allow free models (OpenRouter public list)
  const freeModels = ['gpt-4o-mini', 'openchat', 'nous-hermes-2', 'mythomist', 'starling-lm', 'phi-3', 'mistral', 'dolphin-mixtral'];
  if (!freeModels.includes(model)) model = 'gpt-4o-mini';
  let best = FAQ.faq.find(item => question.toLowerCase().includes(item.question.split(' ')[0].toLowerCase()));
  const prompt = `You are an assistant that only answers questions about AL FALAH ONLINE website using the following FAQ data:\n${JSON.stringify(FAQ)}\n\nQuestion: ${question}\nAnswer:`;
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300
      })
    });
    const data = await r.json();
    let answer = data?.choices?.[0]?.message?.content || '';
    if (!answer && best) answer = best.answer;
    if (!answer) answer = 'Sorry, I can only answer questions about AL FALAH ONLINE FAQ.';
    res.json({ answer, model });
  } catch (err) {
    res.json({ answer: best ? best.answer : 'Sorry, I can only answer questions about AL FALAH ONLINE FAQ.', model });
  }
});

// Serve submissions.json for dashboard
app.get('/api/submissions', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'submissions.json'));
});

app.delete('/api/submissions/:index', isAuthenticated, (req, res) => {
    const index = parseInt(req.params.index, 10);
    const subPath = path.join(__dirname, 'submissions.json');
    let submissions = [];
    try {
        if (fs.existsSync(subPath)) {
            submissions = JSON.parse(fs.readFileSync(subPath, 'utf8'));
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error reading submissions.' });
    }

    if (index >= 0 && index < submissions.length) {
        submissions.splice(index, 1);
        fs.writeFileSync(subPath, JSON.stringify(submissions, null, 2));
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: 'Invalid submission index.' });
    }
});

app.use(express.static(__dirname));
app.listen(3000, () => console.log('FAQ AI server listening on port 3000'));
