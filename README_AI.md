AL FALAH ONLINE — AI FAQ assistant setup

This README explains how to add a small AI assistant that answers only questions about the website FAQ using a secure OpenRouter (or OpenAI-compatible) backend.

IMPORTANT: Do NOT commit API keys into your repository. Store them in environment variables on your server.

1) What this repository contains (new files)
- `faq_knowledge.json` — small local knowledge base extracted from the site's FAQ.
- This README (instructions and a small server example).

2) How it works (recommended, secure architecture)
- Host a tiny server (Node/Express or Python/Flask) that:
  - Loads `faq_knowledge.json`.
  - Accepts user questions from the frontend (`/ask` endpoint).
  - Checks whether the question is within scope (FAQ-related). Optionally, do a similarity match locally.
  - Calls OpenRouter (server-side) with your API key (stored as env var) to get a short, constrained answer using the FAQ data as context.
  - Returns the answer to the browser.

3) Node.js example (server-side) — keep your key in an env var `OPENROUTER_API_KEY`

// Example (pseudo-code)
// Install: npm install express node-fetch body-parser

const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const app = express();
app.use(express.json());

const FAQ = JSON.parse(fs.readFileSync('faq_knowledge.json', 'utf8'));
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY; // set this on your server

app.post('/ask', async (req, res) => {
  const question = req.body.question || '';

  // Basic guard: only allow questions if they contain keywords from the FAQ
  const allowed = FAQ.faq.some(item => question.toLowerCase().includes(item.question.split(' ')[0].toLowerCase()));
  if (!allowed) return res.status(400).json({ error: 'Question out of FAQ scope' });

  // Example prompt: provide an answer constrained to the FAQ content
  const prompt = `You are an assistant that only answers questions about AL FALAH ONLINE website using the following FAQ data:\n${JSON.stringify(FAQ)}\n\nQuestion: ${question}\nAnswer:`;

  // Call OpenRouter (example endpoint). Replace with actual model/endpoint details.
  const r = await fetch('https://api.openrouter.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_KEY}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 300 })
  });
  const data = await r.json();
  const answer = data?.choices?.[0]?.message?.content || 'Sorry, could not generate an answer.';
  res.json({ answer });
});

app.listen(3000, () => console.log('FAQ AI server listening on port 3000'));

4) Frontend usage
- On the client, POST to `/ask` with { question: '...' } and show the returned `answer` in a UI bubble.

5) Security notes
- Never expose the API key client-side.
- Use rate limiting and request validation on the server.
- Keep answers short and constrained; the server should verify the question is within scope before contacting the AI.

6) Models
- Use fast, accurate models available on OpenRouter; you can choose a model that fits your latency and cost needs (e.g., `gpt-4o-mini`, `gpt-4o` variants, or others listed by OpenRouter). Configure `max_tokens` and temperature accordingly.

If you want, I can:
- Add a simple Node server file (`server.js`) to the repo with the example above (without your key), and a small frontend `ask` UI that calls it.
- Add client-side UI elements on the site for asking FAQ questions and displaying answers.

Tell me whether you'd like the example server + frontend scaffold added to your repo (I will NOT store any API keys).