import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ProcessingStatus } from '@prisma/client';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  bitrate: number;
}

interface TranscodingResult {
  original: string;
  '1080p'?: string;
  '720p'?: string;
  '480p'?: string;
  '360p'?: string;
}

interface UploadResult {
  original: string;
  '1080p'?: string;
  '720p'?: string;
  '480p'?: string;
  '360p'?: string;
}

@Injectable()
export class VideoProcessingService {
  private readonly logger = new Logger(VideoProcessingService.name);
  private readonly outputDir: string;
  private readonly s3Bucket: string;
  private readonly s3Region: string;
  private readonly s3Client: S3Client;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.outputDir = this.configService.get(
      'VIDEO_OUTPUT_DIR',
      './processed-videos',
    );
    this.s3Bucket = this.configService.get('AWS_S3_BUCKET', 'edumaster-videos');
    this.s3Region = this.configService.get('AWS_REGION', 'us-east-1');

    // Initialize S3 client
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials are required');
    }

    this.s3Client = new S3Client({
      region: this.s3Region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.ensureOutputDir();
  }

  async processVideo(lectureId: string, videoFilePath: string): Promise<void> {
    const lecture = await this.prisma.lecture.findUnique({
      where: { id: lectureId },
    });

    if (!lecture) {
      throw new Error(`Lecture ${lectureId} not found`);
    }

    try {
      // Update processing status
      await this.prisma.lecture.update({
        where: { id: lectureId },
        data: {
          processingStatus: ProcessingStatus.PROCESSING,
        },
      });

      this.logger.log(`Starting video processing for lecture ${lectureId}`);

      // Get video metadata
      const metadata = await this.getVideoMetadata(videoFilePath);

      // Update lecture duration
      await this.prisma.lecture.update({
        where: { id: lectureId },
        data: {
          duration: Math.round(metadata.duration),
        },
      });

      // Create output directory for this lecture
      const lectureOutputDir = path.join(this.outputDir, lectureId);
      fs.mkdirSync(lectureOutputDir, { recursive: true });

      // Generate thumbnail
      const thumbnailPath = await this.generateThumbnail(
        videoFilePath,
        lectureOutputDir,
        metadata.duration,
      );

      // Transcode to multiple qualities
      const transcodedFiles = await this.transcodeVideo(
        videoFilePath,
        lectureOutputDir,
        metadata,
      );

      // Generate HLS playlist
      const hlsUrl = await this.generateHLSPlaylist(
        transcodedFiles,
        lectureOutputDir,
        lectureId,
      );

      // Upload to S3
      const uploadedUrls = await this.uploadToS3(transcodedFiles, lectureId);
      const uploadedThumbnail = await this.uploadThumbnailToS3(
        thumbnailPath,
        lectureId,
      );

      // Update lecture with processed URLs
      await this.prisma.lecture.update({
        where: { id: lectureId },
        data: {
          videoUrl: uploadedUrls.original,
          hlsUrl: hlsUrl,
          thumbnail: uploadedThumbnail,
          processingStatus: ProcessingStatus.COMPLETED,
        },
      });

      this.logger.log(`Video processing completed for lecture ${lectureId}`);

      // Clean up local files
      this.cleanupLocalFiles(lectureOutputDir);
    } catch (error) {
      this.logger.error(
        `Video processing failed for lecture ${lectureId}:`,
        error,
      );

      await this.prisma.lecture.update({
        where: { id: lectureId },
        data: {
          processingStatus: ProcessingStatus.FAILED,
        },
      });

      throw error;
    }
  }

  private ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private async getVideoMetadata(
    videoFilePath: string,
  ): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoFilePath, (err, metadata) => {
        if (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          reject(new Error(`Failed to get video metadata: ${errorMessage}`));
          return;
        }

        const videoStream = metadata.streams.find(
          (stream) => stream.codec_type === 'video',
        );
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          bitrate: parseInt(String(metadata.format.bit_rate || '0')),
        });
      });
    });
  }

  private async generateThumbnail(
    videoFilePath: string,
    outputDir: string,
    duration: number,
  ): Promise<string> {
    const thumbnailPath = path.join(outputDir, 'thumbnail.jpg');
    const timestamp = Math.floor(duration * 0.1); // 10% into the video

    return new Promise((resolve, reject) => {
      ffmpeg(videoFilePath)
        .screenshots({
          timestamps: [timestamp],
          filename: 'thumbnail.jpg',
          folder: outputDir,
          size: '750x422',
        })
        .on('end', () => resolve(thumbnailPath))
        .on('error', reject);
    });
  }

  private async transcodeVideo(
    videoFilePath: string,
    outputDir: string,
    metadata: VideoMetadata,
  ): Promise<TranscodingResult> {
    const qualities = [
      { name: '1080p' as const, width: 1920, height: 1080, bitrate: '5000k' },
      { name: '720p' as const, width: 1280, height: 720, bitrate: '2500k' },
      { name: '480p' as const, width: 854, height: 480, bitrate: '1000k' },
      { name: '360p' as const, width: 640, height: 360, bitrate: '500k' },
    ];

    const transcodedFiles: TranscodingResult = {
      original: '',
    };

    // Copy original file
    const originalPath = path.join(outputDir, 'original.mp4');
    fs.copyFileSync(videoFilePath, originalPath);
    transcodedFiles.original = originalPath;

    // Transcode to different qualities
    for (const quality of qualities) {
      if (metadata.width >= quality.width) {
        const outputPath = path.join(outputDir, `${quality.name}.mp4`);

        await new Promise<void>((resolve, reject) => {
          ffmpeg(videoFilePath)
            .size(`${quality.width}x${quality.height}`)
            .videoBitrate(quality.bitrate)
            .audioBitrate('128k')
            .output(outputPath)
            .on('end', () => {
              transcodedFiles[quality.name] = outputPath;
              resolve();
            })
            .on('error', (err) =>
              reject(new Error(`Transcoding failed: ${err.message}`)),
            )
            .run();
        });
      }
    }

    return transcodedFiles;
  }

  private async generateHLSPlaylist(
    transcodedFiles: TranscodingResult,
    outputDir: string,
    lectureId: string,
  ): Promise<string> {
    const playlistPath = path.join(outputDir, 'playlist.m3u8');

    let playlistContent = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

    // Add quality variants
    const qualities: Array<keyof TranscodingResult> = [
      '1080p',
      '720p',
      '480p',
      '360p',
    ];

    for (const quality of qualities) {
      if (transcodedFiles[quality]) {
        const bitrate = this.getBitrateForQuality(quality);
        playlistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bitrate},RESOLUTION=${this.getResolutionForQuality(quality)}\n`;
        playlistContent += `${quality}.m3u8\n\n`;
      }
    }

    // Generate individual playlists for each quality
    for (const quality of qualities) {
      if (transcodedFiles[quality]) {
        const qualityPlaylistPath = path.join(outputDir, `${quality}.m3u8`);
        await this.generateQualityPlaylist(
          transcodedFiles[quality],
          qualityPlaylistPath,
        );
      }
    }

    fs.writeFileSync(playlistPath, playlistContent);
    return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/lectures/${lectureId}/playlist.m3u8`;
  }

  private async generateQualityPlaylist(
    videoPath: string,
    playlistPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          '-c:v h264',
          '-c:a aac',
          '-hls_time 10',
          '-hls_list_size 0',
          '-hls_segment_filename',
          path.join(path.dirname(playlistPath), 'segment_%03d.ts'),
        ])
        .output(playlistPath)
        .on('end', () => resolve())
        .on('error', (err) =>
          reject(new Error(`HLS generation failed: ${err.message}`)),
        )
        .run();
    });
  }

  private getBitrateForQuality(quality: string): string {
    const bitrates: Record<string, string> = {
      '1080p': '5000000',
      '720p': '2500000',
      '480p': '1000000',
      '360p': '500000',
    };
    return bitrates[quality] || '1000000';
  }

  private getResolutionForQuality(quality: string): string {
    const resolutions: Record<string, string> = {
      '1080p': '1920x1080',
      '720p': '1280x720',
      '480p': '854x480',
      '360p': '640x360',
    };
    return resolutions[quality] || '1280x720';
  }

  private async uploadToS3(
    transcodedFiles: TranscodingResult,
    lectureId: string,
  ): Promise<UploadResult> {
    const baseUrl = `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/lectures/${lectureId}`;
    const uploadResult: UploadResult = {
      original: '',
    };

    try {
      // Upload original file
      if (transcodedFiles.original) {
        const originalKey = `lectures/${lectureId}/original.mp4`;
        await this.uploadFileToS3(
          transcodedFiles.original,
          originalKey,
          'video/mp4',
        );
        uploadResult.original = `${baseUrl}/original.mp4`;
      }

      // Upload transcoded files
      const qualities: Array<keyof TranscodingResult> = [
        '1080p',
        '720p',
        '480p',
        '360p',
      ];

      for (const quality of qualities) {
        if (transcodedFiles[quality]) {
          const key = `lectures/${lectureId}/${quality}.mp4`;
          await this.uploadFileToS3(transcodedFiles[quality], key, 'video/mp4');
          uploadResult[quality] = `${baseUrl}/${quality}.mp4`;
        }
      }

      this.logger.log(
        `Successfully uploaded video files for lecture ${lectureId}`,
      );
      return uploadResult;
    } catch (error) {
      this.logger.error(
        `Failed to upload video files for lecture ${lectureId}:`,
        error,
      );
      throw new Error(
        `S3 upload failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async uploadThumbnailToS3(
    thumbnailPath: string,
    lectureId: string,
  ): Promise<string> {
    try {
      const key = `lectures/${lectureId}/thumbnail.jpg`;
      await this.uploadFileToS3(thumbnailPath, key, 'image/jpeg');
      const thumbnailUrl = `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${key}`;
      this.logger.log(
        `Successfully uploaded thumbnail for lecture ${lectureId}`,
      );

      return thumbnailUrl;
    } catch (error) {
      this.logger.error(
        `Failed to upload thumbnail for lecture ${lectureId}:`,
        error,
      );
      throw new Error(
        `Thumbnail upload failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async uploadFileToS3(
    filePath: string,
    key: string,
    contentType: string,
  ): Promise<void> {
    const fileStream = fs.createReadStream(filePath);

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.s3Bucket,
        Key: key,
        Body: fileStream,
        ContentType: contentType,
        ACL: 'public-read', // Make files publicly accessible
      },
    });

    await upload.done();
  }

  private cleanupLocalFiles(outputDir: string): void {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
  }
}
