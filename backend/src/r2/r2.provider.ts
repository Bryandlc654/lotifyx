import { S3Client } from "@aws-sdk/client-s3";

export const R2_CLIENT = "R2_CLIENT";

export const r2ClientProvider = {
  provide: R2_CLIENT,
  useFactory: () => {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKey = process.env.R2_ACCESS_KEY_ID;
    const secretKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!accountId || !accessKey || !secretKey) {
      console.warn("[R2] Faltan variables de entorno R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
    }
    return new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKey || "", secretAccessKey: secretKey || "" },
      forcePathStyle: true,
    });
  },
};
