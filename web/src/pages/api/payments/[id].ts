import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const base = process.env.SERVER_BASE_URL || "";
  const url = `${base}/payments/${id}`;
  const r = await fetch(url, { headers: { Accept: "application/json", Cookie: req.headers.cookie || "" } });
  const json = await r.json();
  res.status(r.status).json(json);
}
