import AWS from 'aws-sdk';
import { getEnv } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

export class S3UploadService {
  private s3: AWS.S3;
  private bucket: string;

  constructor() {
    const env = getEnv();
    
    AWS.config.update({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION
    });

    this.s3 = new AWS.S3();
    this.bucket = env.AWS_S3_BUCKET;
  }

  /**
   * Upload file to S3 and return the URL
   */
  async uploadFile(
    file: Buffer,
    filename: string,
    contentType: string,
    folder: string = 'uploads'
  ): Promise<string> {
    const key = `${folder}/${uuidv4()}-${filename}`;

    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read'
    };

    try {
      const result = await this.s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Array<{ buffer: Buffer; filename: string; contentType: string }>,
    folder: string = 'uploads'
  ): Promise<string[]> {
    const uploadPromises = files.map(file =>
      this.uploadFile(file.buffer, file.filename, file.contentType, folder)
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Upload a raw buffer with a given S3 key and content type
   */
  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<string> {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read'
    };

    try {
      const result = await this.s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      console.error('S3 uploadBuffer error:', error);
      throw new Error('Failed to upload buffer to S3');
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(url: string): Promise<void> {
    // Extract key from URL
    const urlParts = url.split('/');
    const key = urlParts.slice(3).join('/'); // Remove protocol and domain

    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: this.bucket,
      Key: key
    };

    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  /**
   * Generate presigned URL for direct upload from client
   */
  async generatePresignedUrl(
    filename: string,
    contentType: string,
    folder: string = 'uploads'
  ): Promise<{ url: string; key: string }> {
    const key = `${folder}/${uuidv4()}-${filename}`;

    const params = {
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
      Expires: 300 // 5 minutes
    };

    try {
      const url = await this.s3.getSignedUrlPromise('putObject', params);
      return { url, key };
    } catch (error) {
      console.error('Presigned URL error:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }
}
