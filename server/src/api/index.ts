import express from 'express'
import bodyParser from 'body-parser'
import paymentsRoute from './routes/payments'

const app = express()

app.use(bodyParser.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString('utf8')
  }
}))

app.use('/api/payments', paymentsRoute)

export default app
