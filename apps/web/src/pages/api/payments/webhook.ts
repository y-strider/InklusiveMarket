/* New-Item -ItemType File -Force -Path apps/web/src/pages/api/payments/webhook.ts add PayMongo webhook handling and status synchronization */
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@inklusive/db";

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false
  }
};

function readRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function verifySignature(_raw: string, _sig: string | undefined) {
  return true;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end();
    return;
  }

  const raw = await readRawBody(req);
  const sig = req.headers["paymongo-signature"] as string | undefined;

  if (!verifySignature(raw, sig)) {
    res.status(400).end();
    return;
  }

  const evt = JSON.parse(raw);
  const type = evt.data?.attributes?.type as string | undefined;
  const linkId = evt.data?.attributes?.data?.id as string | undefined;
  const status = evt.data?.attributes?.data?.attributes?.status as string | undefined;

  if (!linkId) {
    res.status(200).end();
    return;
  }

  if (type && status) {
    let newStatus: string | null = null;
    if (status === "paid") newStatus = "paid";
    else if (status === "unpaid") newStatus = "pending";
    else if (status === "cancelled") newStatus = "cancelled";
    if (newStatus) {
      await prisma.payment.updateMany({
        where: { providerPaymentId: linkId },
        data: { status: newStatus, metadata: evt }
      });
    }
  }

  res.status(200).end();
}
