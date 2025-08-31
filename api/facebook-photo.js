// api/facebook-photo.js
export default async function handler(req, res) {
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  const origin = req.headers.origin;
  const allowed = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim());
  if (origin && allowed.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = req.body || {};
    const pageId = body.page_id || process.env.FB_PAGE_ID;
    const token = body.page_token || process.env.FB_PAGE_ACCESS_TOKEN;
    const { photo_url, caption, published } = body;

    if (!pageId || !token || !photo_url) return res.status(400).json({ error: "Missing fields" });

    const params = new URLSearchParams({
      url: photo_url,
      caption: caption || "",
      published: published === false ? "false" : "true",
      access_token: token
    });

    const fbRes = await fetch(`https://graph.facebook.com/v23.0/${pageId}/photos`, {
      method: "POST",
      body: params
    });
    const data = await fbRes.json();
    return res.status(fbRes.ok && !data.error ? 200 : 400).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
