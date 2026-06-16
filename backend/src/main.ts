import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Body size limits ─────────────────────
  app.use(json({ limit: "10mb" }));
  app.use(urlencoded({ limit: "10mb", extended: true }));

  // ─── Security headers (CORP: cross-origin para imágenes) ──
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // ─── CORS ──────────────────────────────────
  app.enableCors({
    origin: ["http://localhost:3000", "https://devspro.xyz", "https://www.devspro.xyz"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  });

  // ─── Global validation ─────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  app.setGlobalPrefix("api", {
    exclude: ["uploads/(.*)"],
  });

  const port = process.env.APP_PORT || 4000;
  await app.listen(port);
  console.log(`Lotifyx API running on http://localhost:${port}`);
}
bootstrap();
