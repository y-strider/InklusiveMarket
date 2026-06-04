import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { knex } from 'knex';
import { OrdersRepository } from './domain/orders/repository';
import { OrdersService } from './domain/orders/service';
import { PayMongoProvider } from './integrations/paymongo/PayMongoProvider';
import { OrdersController } from './http/controllers/orders.controller';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ type: ['application/json', 'application/*+json'] }));

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL
});

const repo = new OrdersRepository(db);
const payment = new PayMongoProvider();
const service = new OrdersService(repo, payment);
app.use('/api', OrdersController(service));

export default app;
