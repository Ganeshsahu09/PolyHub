import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET ?? 'polyhub-models';
    this.client = new S3Client({
      region: process.env.AWS_REGION ?? 'us-east-1',
      endpoint: process.env.AWS_ENDPOINT,
      forcePathStyle: true, // required for MinIO
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  buildKey(prefix: string, originalFilename: string): string {
    const ext = originalFilename.split('.').pop();
    return `${prefix}/${randomUUID()}.${ext}`;
  }

  // contentLength, when provided, is baked into the SigV4 signature — the
  // uploader MUST send exactly that many bytes or the PUT fails with a
  // signature mismatch. This is real server-side enforcement, not a
  // client-side suggestion: even someone calling the API directly
  // (bypassing your frontend's own checks) can't upload a different size
  // than what they declared when requesting the URL.
  async getPresignedUploadUrl(key: string, contentType: string, contentLength?: number): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ...(contentLength ? { ContentLength: contentLength } : {}),
    });
    return getSignedUrl(this.client, command, { expiresIn: 300 }); // 5 min
  }

  async getPresignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: 3600 }); // 1 hour
  }
}