import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ProcessingStatus,
  UploadStatus,
  UploadSession,
  Lecture,
} from '@prisma/client';
import { VideoProcessingService } from '../services/video-processing.service';
import { ConfigService } from '@nestjs/config';

export interface VideoProcessingJob {
  lectureId: string;
  videoFilePath: string;
  userId: string;
}

interface CleanupResults {
  expiredSessions: number;
  failedSessions: number;
  orphanedFiles: number;
  failedLectures: number;
  storageCleaned: number;
  errors: string[];
}

@Processor('video-processing')
export class VideoProcessingProcessor {
  private readonly logger = new Logger(VideoProcessingProcessor.name);
  private readonly tempDir: string;
  private readonly outputDir: string;

  constructor(
    private videoProcessingService: VideoProcessingService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.tempDir = this.configService.get('TEMP_DIR', './temp');
    this.outputDir = this.configService.get(
      'VIDEO_OUTPUT_DIR',
      './processed-videos',
    );
  }

  @Process('process-video')
  async handleVideoProcessing(job: Job<VideoProcessingJob>) {
    const { lectureId, videoFilePath } = job.data;

    this.logger.log(`Processing video for lecture ${lectureId}`);

    try {
      // Update job progress
      void job.progress(10);

      // Process the video
      await this.videoProcessingService.processVideo(lectureId, videoFilePath);

      // Update job progress
      void job.progress(100);

      this.logger.log(`Video processing completed for lecture ${lectureId}`);

      return {
        success: true,
        lectureId,
        message: 'Video processed successfully',
      };
    } catch (error) {
      this.logger.error(
        `Video processing failed for lecture ${lectureId}:`,
        error,
      );

      // Update job progress to indicate failure
      void job.progress(0);

      throw error;
    }
  }

  @Process('cleanup-failed-uploads')
  async handleCleanupFailedUploads() {
    this.logger.log('Starting cleanup of failed uploads');

    try {
      const cleanupResults = await this.cleanupFailedUploads();

      this.logger.log(`Cleanup completed: ${cleanupResults.summary}`);

      return {
        success: true,
        message: 'Failed uploads cleaned up successfully',
        details: cleanupResults,
      };
    } catch (error) {
      this.logger.error('Failed uploads cleanup failed:', error);
      throw error;
    }
  }

  private async cleanupFailedUploads(): Promise<{
    summary: string;
    details: CleanupResults;
  }> {
    const results: CleanupResults = {
      expiredSessions: 0,
      failedSessions: 0,
      orphanedFiles: 0,
      failedLectures: 0,
      storageCleaned: 0,
      errors: [],
    };

    // 1. Clean up expired upload sessions
    try {
      const expiredSessions = await this.prisma.uploadSession.findMany({
        where: {
          expiresAt: { lt: new Date() },
          status: { not: UploadStatus.COMPLETED },
        },
      });

      for (const session of expiredSessions) {
        await this.cleanupUploadSession(session);
        results.expiredSessions++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      results.errors.push(`Expired sessions cleanup: ${errorMessage}`);
    }

    // 2. Clean up failed upload sessions
    try {
      const failedSessions = await this.prisma.uploadSession.findMany({
        where: {
          status: UploadStatus.FAILED,
          createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Older than 24 hours
        },
      });

      for (const session of failedSessions) {
        await this.cleanupUploadSession(session);
        results.failedSessions++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      results.errors.push(`Failed sessions cleanup: ${errorMessage}`);
    }

    // 3. Clean up failed video processing lectures
    try {
      const failedLectures = await this.prisma.lecture.findMany({
        where: {
          processingStatus: ProcessingStatus.FAILED,
          updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Older than 7 days
        },
        include: { section: { include: { course: true } } },
      });

      for (const lecture of failedLectures) {
        await this.cleanupFailedLecture(lecture);
        results.failedLectures++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      results.errors.push(`Failed lectures cleanup: ${errorMessage}`);
    }

    // 4. Clean up orphaned temporary files
    try {
      const orphanedFiles = await this.cleanupOrphanedFiles();
      results.orphanedFiles = orphanedFiles;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      results.errors.push(`Orphaned files cleanup: ${errorMessage}`);
    }

    // 5. Clean up old processing artifacts
    try {
      const cleanedStorage = await this.cleanupProcessingArtifacts();
      results.storageCleaned = cleanedStorage;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      results.errors.push(`Processing artifacts cleanup: ${errorMessage}`);
    }

    return {
      summary: `Cleaned ${results.expiredSessions} expired sessions, ${results.failedSessions} failed sessions, ${results.failedLectures} failed lectures, ${results.orphanedFiles} orphaned files`,
      details: results,
    };
  }

  private async cleanupUploadSession(session: UploadSession): Promise<void> {
    try {
      // Clean up temporary files
      const sessionDir = path.join(this.tempDir, session.id);
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }

      // Update session status to EXPIRED if not already FAILED
      if (session.status !== UploadStatus.FAILED) {
        await this.prisma.uploadSession.update({
          where: { id: session.id },
          data: { status: UploadStatus.EXPIRED },
        });
      }

      this.logger.log(`Cleaned up upload session ${session.id}`);
    } catch (error) {
      this.logger.error(`Failed to cleanup session ${session.id}:`, error);
      throw error;
    }
  }

  private async cleanupFailedLecture(
    lecture: Lecture & { section: { course: any } },
  ): Promise<void> {
    try {
      // Clean up processing artifacts
      const lectureOutputDir = path.join(this.outputDir, lecture.id);
      if (fs.existsSync(lectureOutputDir)) {
        fs.rmSync(lectureOutputDir, { recursive: true, force: true });
      }

      // Reset processing status to allow retry
      await this.prisma.lecture.update({
        where: { id: lecture.id },
        data: {
          processingStatus: ProcessingStatus.PENDING,
          videoUrl: null,
          hlsUrl: null,
          thumbnail: null,
        },
      });

      this.logger.log(`Reset failed lecture ${lecture.id} for retry`);
    } catch (error) {
      this.logger.error(`Failed to cleanup lecture ${lecture.id}:`, error);
      throw error;
    }
  }

  private async cleanupOrphanedFiles(): Promise<number> {
    let cleanedCount = 0;

    try {
      // Find all session directories in temp folder
      const tempDirs = fs
        .readdirSync(this.tempDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      // Check which directories don't have corresponding upload sessions
      for (const dirName of tempDirs) {
        const session = await this.prisma.uploadSession.findUnique({
          where: { id: dirName },
        });

        if (!session || session.status === UploadStatus.COMPLETED) {
          const dirPath = path.join(this.tempDir, dirName);
          fs.rmSync(dirPath, { recursive: true, force: true });
          cleanedCount++;
          this.logger.log(`Cleaned orphaned directory ${dirName}`);
        }
      }
    } catch (error) {
      this.logger.error('Error cleaning orphaned files:', error);
      throw error;
    }

    return cleanedCount;
  }

  private async cleanupProcessingArtifacts(): Promise<number> {
    let cleanedCount = 0;

    try {
      // Find all lecture directories in output folder
      const outputDirs = fs
        .readdirSync(this.outputDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      // Check which directories don't have corresponding lectures or are for failed lectures
      for (const dirName of outputDirs) {
        const lecture = await this.prisma.lecture.findUnique({
          where: { id: dirName },
        });

        if (!lecture || lecture.processingStatus === ProcessingStatus.FAILED) {
          const dirPath = path.join(this.outputDir, dirName);
          fs.rmSync(dirPath, { recursive: true, force: true });
          cleanedCount++;
          this.logger.log(`Cleaned processing artifacts for ${dirName}`);
        }
      }
    } catch (error) {
      this.logger.error('Error cleaning processing artifacts:', error);
      throw error;
    }

    return cleanedCount;
  }
}
