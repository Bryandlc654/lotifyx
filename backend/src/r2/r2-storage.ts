import { Request } from "express";
import multer from "multer";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { PassThrough } from "stream";
import { extname } from "path";

const BUCKET = "loti";
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const TOKEN = process.env.R2_API_TOKEN!;
const BASE_URL = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET}`;

const defaultClient = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: TOKEN, secretAccessKey: TOKEN },
});

export class R2Storage implements multer.StorageEngine {
  private client: S3Client;
  private folder: string;

  constructor(opts: { folder?: string; client?: S3Client } = {}) {
    this.client = opts.client || defaultClient;
    this.folder = opts.folder || "uploads";
  }

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    callback: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ): void {
    const ext = extname(file.originalname);
    const key = `${this.folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

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
      callback(null, { filename: `${BASE_URL}/${key}`, path: `${BASE_URL}/${key}` });
    }).catch((err) => {
      callback(err);
    });

    file.stream.pipe(pass);
  }

  _removeFile(
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null) => void,
  ): void {
    const key = file.filename.replace(`${BASE_URL}/`, "");
    if (!key || key === file.filename) return callback(null);

    this.client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
      .then(() => callback(null))
      .catch(() => callback(null));
  }
}
