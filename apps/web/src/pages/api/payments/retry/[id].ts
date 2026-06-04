/* New-Item -ItemType File -Force -Path apps/web/src/pages/api/payments/retry/[id].ts add retry endpoint to restart checkout respecting credentials rule */
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@inklusive/db";

const prisma = new PrismaClient();

function hasPaymongoCreds() {
  return Boolean(process.env.PAYMONGO_SECRET_KEY);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).end();
    return;
  }

  const id = req.query.id as string;
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) {
    res.status(404).end();
    return;
  }

  if (!hasPaymongoCreds()) {
    res.status(200).json({
      message: "PayMongo payment processing is temporarily unavailable because payment credentials have not been configured by the system administrator.",
      checkoutUrl: null
    });
    return;
  }

  if (payment.providerPaymentId) {
    const r = await fetch(`[api.paymongo.com](https://api.paymongo.com/v1/links/${payment.providerPaymentId})`, {
      headers: {
        Authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString("base64")}`
      }
    });
    if (r.ok) {
      const j = await r.json();
      const checkoutUrl = j.data.attributes.checkout_url as string;
      res.status(200).json({ checkoutUrl });
      return;
    }
  }

  res.status(400).json({ error: "Unable to retry payment" });
}
