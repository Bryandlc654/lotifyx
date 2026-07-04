import { Controller, Get, Post } from '@nestjs/common';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import * as net from "net";
import { MailService } from "./mail/mail.service";
import { SettingsService } from "./settings/settings.service";

@Controller('debug')
export class DebugController {
  constructor(
    private readonly mailService: MailService,
    private readonly settings: SettingsService,
  ) {}
  @Get('smtp')
  async debugSmtp() {
    const host = await this.settings.get("smtp_host");
    const port = await this.settings.get("smtp_port");
    const user = await this.settings.get("smtp_user");
    const pass = await this.settings.get("smtp_pass");
    const transporterHost = (this.mailService as any).transporter?.options?.host;

    return {
      configured: !!host && !!user && !!pass,
      db_host: host,
      db_port: port,
      db_user: user ? "***" + user.slice(-4) : null,
      db_pass: pass ? "***" : null,
      transporter_host: transporterHost || "no configurado",
    };
  }

  @Get('test-email')
  async testEmail() {
    try {
      await (this.mailService as any).sendVerificationCode(
        (await this.settings.get("smtp_user")),
        "123456",
        "Test",
      );
      return { status: "OK", message: "Correo de prueba enviado" };
    } catch (err: any) {
      return { status: "ERROR", message: err.message, code: err.code };
    }
  }

  @Get('smtp-connect')
  async testSmtpConnect() {
    const host = await this.settings.get("smtp_host");
    const port = parseInt((await this.settings.get("smtp_port")) || "587");
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(5000);
      socket.on("connect", () => {
        socket.destroy();
        resolve({ status: "OK", host, port, message: "Conexion TCP exitosa" });
      });
      socket.on("timeout", () => {
        socket.destroy();
        resolve({ status: "TIMEOUT", host, port, message: "No respondio en 5s" });
      });
      socket.on("error", (err: NodeJS.ErrnoException) => {
        socket.destroy();
        resolve({ status: "ERROR", host, port, code: err.code, message: err.message });
      });
      socket.connect(port, host!);
    });
  }

  @Get('r2')
  async testR2() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKey = process.env.R2_ACCESS_KEY_ID;
    const secretKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKey || !secretKey) {
      return { status: "ERROR", message: "Faltan variables de entorno R2" };
    }

    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      forcePathStyle: true,
    });

    const results: any[] = [];
    results.push({ test: "config", publicUrl: process.env.R2_PUBLIC_URL || "(no configurado)" });

    // Test 1: List objects in loti bucket
    try {
      const list = await client.send(new ListObjectsV2Command({ Bucket: "loti", MaxKeys: 5 }));
      results.push({ test: "list", status: "OK", objects: list.KeyCount });
    } catch (err: any) {
      results.push({ test: "list", status: "ERROR", name: err.name, message: err.message, code: err.Code });
    }

    // Test 2: Upload a small test file
    try {
      await client.send(new PutObjectCommand({
        Bucket: "loti",
        Key: "_test_r2.txt",
        Body: "R2 connection test",
        ContentType: "text/plain",
      }));
      results.push({ test: "upload", status: "OK" });
    } catch (err: any) {
      results.push({ test: "upload", status: "ERROR", name: err.name, message: err.message, code: err.Code });
    }

    return results;
  }
}
