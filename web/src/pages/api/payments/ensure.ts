import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end();
    return;
  }
  const base = process.env.SERVER_BASE_URL || "";
  const url = `${base}/payments/ensure`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Cookie: req.headers.cookie || "" },
    body: JSON.stringify(req.body || {})
  });
  const json = await r.json();
  res.status(r.status).json(json);
}
