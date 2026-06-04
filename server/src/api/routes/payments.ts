import { Router, Request, Response } from 'express'
import { InMemoryPaymentStore } from '../../payments/PaymentModel'
import { PaymentService } from '../../payments/PaymentService'
import { PaymentStatus } from '../../payments/PaymentProvider'

const store = new InMemoryPaymentStore()
const service = new PaymentService(store)
const r = Router()

function requireAuth(req: Request, res: Response, next: Function) {
  const uid = req.headers['x-user-id'] as string
  if (!uid) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  ;(req as any).userId = uid
  next()
}

r.post('/checkout', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string
    const { orderId, amount, currency, description, referenceId, customerEmail, successUrl, cancelUrl } = req.body || {}
    const rec = await service.createCheckout({
      orderId,
      userId,
      amount,
      currency,
      description,
      referenceId,
      customerEmail,
      successUrl,
      cancelUrl
    })
    res.status(201).json({ id: rec.id, checkoutUrl: rec.checkoutUrl, status: rec.status, referenceId: rec.referenceId })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

r.get('/mine', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string
  const { limit, offset, q, status } = req.query
  const parsedStatus = Array.isArray(status) ? status as PaymentStatus[] : status ? [status as PaymentStatus] : []
  const result = await service.listForUser(userId, {
    limit: limit ? parseInt(limit as string, 10) : undefined,
    offset: offset ? parseInt(offset as string, 10) : undefined,
    q: q as string | undefined,
    status: parsedStatus
  })
  res.json(result)
})

r.get('/', async (req: Request, res: Response) => {
  const { limit, offset, q, status } = req.query
  const parsedStatus = Array.isArray(status) ? status as PaymentStatus[] : status ? [status as PaymentStatus] : []
  const result = await service.listAll({
    limit: limit ? parseInt(limit as string, 10) : undefined,
    offset: offset ? parseInt(offset as string, 10) : undefined,
    q: q as string | undefined,
    status: parsedStatus
  })
  res.json(result)
})

r.post('/webhook/paymongo', async (req: Request, res: Response) => {
  const raw = (req as any).rawBody || req.body
  const signature = req.header('Paymongo-Signature') || ''
  const updated = await service.handleWebhook(raw, signature)
  if (!updated) {
    res.status(400).json({ ok: false })
    return
  }
  res.json({ ok: true })
})

export default r
