import "server-only";

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let r2Client: S3Client | null = null;

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("O armazenamento de redações não está configurado.");
  }

  return { accountId, accessKeyId, secretAccessKey, bucket };
}

function getR2Client() {
  const config = getR2Config();

  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return { client: r2Client, bucket: config.bucket };
}

export async function createEssaySourceUploadUrl(key: string, contentType: string) {
  const { client, bucket } = getR2Client();

  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 10 * 60 }
  );
}

export async function createEssaySourceDownloadUrl(key: string) {
  const { client, bucket } = getR2Client();

  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: 10 * 60,
  });
}

export async function getEssaySourceMetadata(key: string) {
  const { client, bucket } = getR2Client();
  const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));

  return {
    contentLength: result.ContentLength ?? 0,
    contentType: result.ContentType ?? null,
  };
}

export async function downloadEssaySource(key: string) {
  const { client, bucket } = getR2Client();
  const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

  if (!result.Body) {
    throw new Error("Arquivo da redação não encontrado.");
  }

  return Buffer.from(await result.Body.transformToByteArray());
}

export async function uploadEssaySource(
  key: string,
  buffer: Buffer,
  contentType: string
) {
  const { client, bucket } = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
}

export async function deleteEssaySources(keys: string[]) {
  if (keys.length === 0) return;

  const { client, bucket } = getR2Client();

  await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: keys.map((Key) => ({ Key })),
        Quiet: true,
      },
    })
  );
}
