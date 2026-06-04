// New-Item -ItemType File -Force -Path apps/web/src/server/payments/paymongo.ts add PayMongo gateway with env-guarded execution and webhook signature verification helper
import { PaymentGateway, CreateCheckoutInput, CheckoutResult, SyncResult, PaymentUnavailableError } from "./abstraction"

function cfg() {
  return {
    secretKey: process.env.PAYMONGO_SECRET_KEY || "",
    publicKey: process.env.PAYMONGO_PUBLIC_KEY || "",
    webhookSecret: process.env.PAYMONGO_WEBHOOK_SECRET || ""
  }
}

async function httpJson(url: string, init: RequestInit): Promise<any> {
  const r = await fetch(url, init)
  if (!r.ok) throw new Error("Bad response")
  return r.json()
}

export class PayMongoGateway implements PaymentGateway {
  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const c = cfg()
    if (!c.publicKey || !c.secretKey) {
      throw new PaymentUnavailableError()
    }
    const payload = {
      data: {
        attributes: {
          amount: input.amount,
          currency: input.currency,
          description: input.description,
          customer: {
            email: input.buyerEmail
          },
          send_email_receipt: true,
          line_items: [
            {
              name: input.description,
              amount: input.amount,
              quantity: 1,
              currency: input.currency
            }
          ],
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${input.orderId}?paid=1`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${input.orderId}?cancelled=1`
        }
      }
    }
    const res = await httpJson("[api.paymongo.com](https://api.paymongo.com/v1/checkout_sessions)", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Basic " + Buffer.from(c.secretKey + ":").toString("base64")
      },
      body: JSON.stringify(payload)
    })
    const sessionId = res.data?.id as string
    const url = res.data?.attributes?.checkout_url as string
    return { externalRef: sessionId, checkoutUrl: url }
  }

  async syncPayment(externalRef: string): Promise<SyncResult> {
    const c = cfg()
    if (!c.secretKey) {
      throw new PaymentUnavailableError()
    }
    const res = await httpJson(`[api.paymongo.com](https://api.paymongo.com/v1/checkout_sessions/${externalRef})`, {
      method: "GET",
      headers: {
        authorization: "Basic " + Buffer.from(c.secretKey + ":").toString("base64")
      }
    })
    const status: string = res.data?.attributes?.status || "unpaid"
    let mapped: SyncResult["status"] = "unpaid"
    if (status === "paid") mapped = "paid"
    else if (status === "processing") mapped = "processing"
    else if (status === "failed") mapped = "failed"
    else if (status === "refunded") mapped = "refunded"
    return { status: mapped, externalRef }
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET || ""
  if (!secret) return false
  const crypto = require("crypto")
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(rawBody, "utf8")
  const digest = hmac.digest("hex")
  return signature === digest
}
