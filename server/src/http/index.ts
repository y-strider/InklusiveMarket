import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { paymentRoutes } from "./routes/paymentRoutes";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

app.use(paymentRoutes);

export default app;
