import { Request } from "express";
import multer from "multer";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { PassThrough } from "stream";
import { extname } from "path";

const BUCKET = "loti";
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;

function getDefaultClient(): S3Client {
  if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY) throw new Error("Faltan variables de entorno R2 (ACCOUNT_ID, ACCESS_KEY_ID, SECRET_ACCESS_KEY)");
  return new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
    forcePathStyle: true,
  });
}

function getBaseUrl(): string {
  return process.env.R2_PUBLIC_URL || `https://${ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET}`;
}

export class R2Storage implements multer.StorageEngine {
  private client: S3Client;
  private folder: string;

  constructor(opts: { folder?: string; client?: S3Client } = {}) {
    this.client = opts.client || getDefaultClient();
    this.folder = opts.folder || "uploads";
  }

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    callback: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ): void {
    try {
      const ext = extname(file.originalname);
      const key = `${this.folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const baseUrl = getBaseUrl();
      const pass = new PassThrough();

      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: BUCKET,
          Key: key,
          Body: pass,
          ContentType: file.mimetype,
        },
      });

      upload.done().then(() => {
        callback(null, { filename: `${baseUrl}/${key}`, path: `${baseUrl}/${key}` });
      }).catch((err: any) => {
        console.error("[R2 Upload Error]", err?.name, err?.message, err?.$metadata?.httpStatusCode, err?.Code);
        callback(new Error(`Error al subir imagen a R2: ${err?.message || "desconocido"}`));
      });

      file.stream.pipe(pass);
    } catch (err: any) {
      console.error("[R2 Storage Init Error]", err?.message);
      callback(err);
    }
  }

  _removeFile(
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null) => void,
  ): void {
    try {
      const baseUrl = getBaseUrl();
      const key = file.filename.replace(`${baseUrl}/`, "");
      if (!key || key === file.filename) return callback(null);

      this.client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
        .then(() => callback(null))
        .catch(() => callback(null));
    } catch {
      callback(null);
    }
  }
}
