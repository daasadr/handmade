import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';

@Injectable()
export class S3Service {
  private s3: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly logger = new Logger(S3Service.name);

  constructor() {
    this.endpoint = process.env.S3_ENDPOINT || '';
    this.bucket = process.env.S3_BUCKET || 'handmade-media';

    this.s3 = new S3Client({
      endpoint: this.endpoint,
      region: process.env.S3_REGION || 'eu-central',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const ext = extname(file.originalname).toLowerCase();
    const key = `${folder}/${randomUUID()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read' as any,
      }),
    );

    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const key = url.replace(`${this.endpoint}/${this.bucket}/`, '');
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      this.logger.warn(`Failed to delete S3 object: ${url}`, err);
    }
  }
}
