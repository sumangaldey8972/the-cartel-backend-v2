import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { openApiSpecification } from "./config/swagger.js";
import { ensureDatabase } from "./middlewares/database.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { verifyTrustedOrigin } from "./middlewares/security.js";
import { authRouter } from "./modules/auth/auth.routes.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.clientOrigins, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());
app.use(verifyTrustedOrigin);

app.get("/api/v1/health", (_request, response) => {
  response.json({ success: true, data: { service: "the-cartel-api", status: "ok" } });
});

app.get("/api/docs.json", (_request, response) => response.json(openApiSpecification));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpecification, { customSiteTitle: "The Cartel API" }));

app.use("/api/v1", ensureDatabase);
app.use("/api/v1/auth", authRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
