import { Controller, Get, Inject } from '@nestjs/common';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { ConfigService } from "@nestjs/config";
import { MailService } from "./mail/mail.service";
import { DataSource } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";

@Controller('debug')
export class DebugController {
  constructor(
    private readonly mailService: MailService,
    private readonly config: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get('brevo')
  async debugBrevo() {
    const apiKey = this.config.get<string>("BREVO_API_KEY");
    return {
      configured: !!apiKey,
      key_prefix: apiKey ? apiKey.substring(0, 12) + "..." : null,
    };
  }

  @Get('test-email')
  async testEmail() {
    try {
      await this.mailService.sendVerificationCode("test@example.com", "123456", "Test");
      return { status: "OK", message: "Correo de prueba enviado (revisa los logs)" };
    } catch (err: any) {
      return { status: "ERROR", message: err.message, code: err.code };
    }
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

  @Get('orders-auction')
  async debugAuctionOrders() {
    try {
      const bids = await this.dataSource.query(
        `SELECT ab.id, ab.checkout_id, ab.auction_id, ab.estado, ab.monto,
                a.product_id, p.title as product_title
         FROM auction_bids ab
         LEFT JOIN auctions a ON a.id = ab.auction_id
         LEFT JOIN products p ON p.id = a.product_id
         WHERE ab.checkout_id IS NOT NULL
         ORDER BY ab.created_at DESC`
      );
      const items = await this.dataSource.query(
        `SELECT oi.*, o.status
         FROM order_items oi
         INNER JOIN orders o ON o.id = oi.order_id
         WHERE o.id IN (SELECT ab.checkout_id FROM auction_bids ab WHERE ab.checkout_id IS NOT NULL)`
      );
      return { bids, items };
    } catch (e: any) {
      return { error: e.message, stack: e.stack?.split('\n').slice(0, 3).join('\n') };
    }
  }

  @Get('fix-auction-items')
  async fixAuctionItems() {
    const missing = await this.dataSource.query(
      `SELECT o.id, o.total_amount, a.product_id
       FROM orders o
       INNER JOIN auction_bids ab ON ab.checkout_id = o.id
       INNER JOIN auctions a ON a.id = ab.auction_id
       WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id)`
    );
    let fixed = 0;
    for (const row of missing) {
      try {
        await this.dataSource.query(
          `INSERT INTO order_items (order_id, product_id, price, created_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING`,
          [row.id, row.product_id, row.total_amount]
        );
        fixed++;
      } catch (e: any) {
        console.error(`[Debug] Fix error for ${row.id.slice(0,8)}:`, e.message);
      }
    }
    return { found: missing.length, fixed };
  }
}
