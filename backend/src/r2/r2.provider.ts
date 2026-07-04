import { S3Client } from "@aws-sdk/client-s3";

export const R2_CLIENT = "R2_CLIENT";

export const r2ClientProvider = {
  provide: R2_CLIENT,
  useFactory: () => {
    const accountId = process.env.R2_ACCOUNT_ID!;
    const token = process.env.R2_API_TOKEN!;

    return new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: token, secretAccessKey: token },
    });
  },
};
