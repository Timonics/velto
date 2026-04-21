/**
 * CloudinaryService – Handles image/video uploads to Cloudinary.
 * 
 * Why Cloudinary?
 * - Automatic image optimisation and transformation.
 * - CDN delivery.
 * - Handles video as well.
 */

import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { EnvironmentService } from '../../config/env/env.service';
import { LoggerService } from '../../common/logger/logger.service';
import { ILogger } from '../../common/logger/logger.interface';

@Injectable()
export class CloudinaryService {
  private readonly logger: ILogger;
  private isConfigured = false;

  constructor(
    private readonly env: EnvironmentService,
    logger: LoggerService,
  ) {
    this.logger = logger.child('CloudinaryService');
    this.init();
  }

  private init() {
    const cloudName = this.env.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.env.get('CLOUDINARY_API_KEY');
    const apiSecret = this.env.get('CLOUDINARY_API_SECRET');
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      this.isConfigured = true;
      this.logger.info('Cloudinary initialised');
    } else {
      this.logger.warn('Cloudinary not configured – media uploads will fail');
    }
  }

  async uploadImage(fileBuffer: Buffer, folder: string): Promise<string> {
    if (!this.isConfigured) throw new Error('Cloudinary not configured');
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        },
      );
      uploadStream.end(fileBuffer);
    });
  }

  async uploadVideo(fileBuffer: Buffer, folder: string): Promise<string> {
    if (!this.isConfigured) throw new Error('Cloudinary not configured');
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'video' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        },
      );
      uploadStream.end(fileBuffer);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    if (!this.isConfigured) return;
    await cloudinary.uploader.destroy(publicId);
  }
}