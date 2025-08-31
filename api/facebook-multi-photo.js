// api/facebook-multi-photo.js
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
    const { photo_urls, message } = body;

    if (!pageId || !token || !Array.isArray(photo_urls) || !photo_urls.length) {
      return res.status(400).json({ error: "page_id, page_token, photo_urls[] required" });
    }

    // Upload photos unpublished
    const fbids = [];
    for (const u of photo_urls) {
      const params = new URLSearchParams({
        url: u,
        published: "false",
        access_token: token
      });
      const r = await fetch(`https://graph.facebook.com/v23.0/${pageId}/photos`, {
        method: "POST",
        body: params
      });
      const j = await r.json();
      if (!j.id) return res.status(400).json({ error: j });
      fbids.push(j.id);
    }

    // Post feed with attached_media
    const url = `https://graph.facebook.com/v23.0/${pageId}/feed`;
    const params = new URLSearchParams();
    if (message) params.set("message", message);
    fbids.forEach((id, i) => params.append(`attached_media[${i}]`, JSON.stringify({ media_fbid: id })));
    params.set("access_token", token);

    const fbRes = await fetch(url, { method: "POST", body: params });
    const data = await fbRes.json();
    return res.status(fbRes.ok && !data.error ? 200 : 400).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
