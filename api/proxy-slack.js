// api/proxy-slack.js — Vercel Serverless Function (Node)
export default async function handler(req, res) {
res.setHeader('Vary', 'Origin');
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
const origin = req.headers.origin;
const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
if (origin && allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);


if (req.method === 'OPTIONS') return res.status(204).end();


if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });


const { channel, text } = req.body || {};
if (!channel || !text) return res.status(400).json({ error: 'channel and text required' });


const r = await fetch('https://slack.com/api/chat.postMessage', {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}` },
body: JSON.stringify({ channel, text })
});
const data = await r.json();
return res.status(r.ok && data.ok ? 200 : 400).json(data);
}
