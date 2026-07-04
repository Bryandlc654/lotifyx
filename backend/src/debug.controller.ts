import { Controller, Get } from '@nestjs/common';
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import * as net from 'net';

@Controller('debug')
export class DebugController {
  @Get('postgres')
  test() {
    return new Promise((resolve) => {
      const socket = net.createConnection({
        host: '51.222.9.248',
        port: 5432,
        timeout: 5000,
      });

      socket.on('connect', () => {
        socket.destroy();
        resolve({ status: 'CONNECTED' });
      });

      socket.on('timeout', () => {
        resolve({ status: 'TIMEOUT' });
      });

      socket.on('error', (err: NodeJS.ErrnoException) => {
        resolve({
          status: 'ERROR',
          code: err.code,
          message: err.message,
        });
      });
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

    try {
      const result = await client.send(new ListBucketsCommand({}));
      return { status: "OK", buckets: result.Buckets?.map(b => b.Name) };
    } catch (err: any) {
      return {
        status: "ERROR",
        name: err.name,
        message: err.message,
        code: err.Code,
        statusCode: err.$metadata?.httpStatusCode,
      };
    }
  }
}
