/* New-Item -ItemType File -Force -Path apps/web/src/pages/api/payments/checkout.ts add checkout API with PayMongo abstraction and disabled live execution without credentials */

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@inklusive/db";
import { v4 as uuidv4 } from "uuid";
import { getSessionUser } from "../../../server/session";

const prisma = new PrismaClient();

function priceToInt(amount: number) {
  return Math.round(amount * 100);
}

function hasPaymongoCreds() {
  return Boolean(process.env.PAYMONGO_SECRET_KEY);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end();
    return;
  }

  const user = await getSessionUser(req, res);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { sellerId, amount, currency } = req.body as { sellerId: string; amount: number; currency?: string };

  if (!sellerId || !amount || amount <= 0) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const reference = `PM-${uuidv4().slice(0, 8).toUpperCase()}`;

  const payment = await prisma.payment.create({
    data: {
      reference,
      amount: priceToInt(amount),
      currency: currency || "PHP",
      status: "pending",
      buyerId: user.id,
      sellerId,
      provider: "paymongo"
    }
  });

  if (!hasPaymongoCreds()) {
    res.status(200).json({
      message: "PayMongo payment processing is temporarily unavailable because payment credentials have not been configured by the system administrator.",
      paymentId: payment.id,
      reference: payment.reference,
      checkoutUrl: null,
      status: payment.status
    });
    return;
  }

  const payload = {
    data: {
      attributes: {
        amount: payment.amount,
        currency: payment.currency,
        description: `Payment ${payment.reference}`,
        statement_descriptor: "InklusiveMarket",
        remarks: payment.reference
      }
    }
  };

  const r = await fetch("[api.paymongo.com](https://api.paymongo.com/v1/links)", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!r.ok) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed" }
    });
    res.status(502).json({ error: "Failed to initialize payment" });
    return;
  }

  const json = await r.json();
  const linkId = json.data.id as string;
  const checkoutUrl = json.data.attributes.checkout_url as string;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerPaymentId: linkId,
      status: "processing",
      metadata: json
    }
  });

  res.status(200).json({
    paymentId: payment.id,
    reference: payment.reference,
    checkoutUrl,
    status: "processing"
  });
}
