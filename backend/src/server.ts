import express from "express";
import bodyParser from "body-parser";
import { PaymentsController } from "./payments/PaymentsController";

const app = express();

app.use(
  "/webhooks/paymongo",
  bodyParser.raw({ type: "*/*" }),
  (req: any, _res, next) => {
    req.rawBody = req.body.toString("utf8");
    next();
  }
);

app.use(bodyParser.json({ limit: "2mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api", PaymentsController());

export default app;
