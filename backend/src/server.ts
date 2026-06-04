import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerPaymentRoutes } from "./payments/controller";

const app = Fastify({ logger: true });

async function main() {
  await app.register(cors, { origin: true, credentials: true });
  await registerPaymentRoutes(app);
  const port = Number(process.env.PORT || 4000);
  await app.listen({ port, host: "0.0.0.0" });
}
main();
