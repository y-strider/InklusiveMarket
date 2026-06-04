import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const base = process.env.SERVER_BASE_URL || "";
  const url = `${base}/payments?${new URLSearchParams(req.query as any).toString()}`;
  const r = await fetch(url, { headers: { Accept: "application/json", Cookie: req.headers.cookie || "" } });
  const json = await r.json();
  res.status(r.status).json(json);
}
