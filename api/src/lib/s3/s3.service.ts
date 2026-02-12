import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { config } from '../utils/config'

export interface IS3Service {
  generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn?: number
  ): Promise<string>
  deleteObject(key: string): Promise<void>
}

export class S3Service implements IS3Service {
  private readonly s3Client: S3Client
  private readonly bucketName: string

  constructor() {
    this.s3Client = new S3Client({
      region: config.AWS_REGION,
    })
    this.bucketName = config.S3_BUCKET_NAME
  }

  async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    })

    return await getSignedUrl(this.s3Client, command, { expiresIn })
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })

    await this.s3Client.send(command)
  }
}
