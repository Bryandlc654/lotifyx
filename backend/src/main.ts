import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { json, urlencoded } from "express";
import * as cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

function getCorsOrigins(): string[] {
  return (process.env.CORS_ORIGINS || "http://localhost:3000,https://devspro.xyz,https://www.devspro.xyz,https://loti.nextboostperu.com")
    .split(",")
    .map(s => s.trim());
}

async function bootstrap() {
  process.on("unhandledRejection", (reason) => console.error("UNHANDLED REJECTION:", reason));
  process.on("uncaughtException", (err) => console.error("UNCAUGHT EXCEPTION:", err));

  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.enableCors({
    origin: getCorsOrigins(),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  });
  app.use(json({ limit: "10mb" }));
  app.use(urlencoded({ limit: "10mb", extended: true }));
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }));
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  app.setGlobalPrefix("api", { exclude: ["uploads/(.*)"] });
  app.enableShutdownHooks();

  const port = process.env.PORT || 10000;
  await app.listen(port, "0.0.0.0");
  console.log(`Lotifyx API running on port ${port}`);
}
bootstrap();
