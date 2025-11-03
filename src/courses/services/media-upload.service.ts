import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CancelUploadDto,
  CompleteUploadDto,
  InitiateUploadDto,
  UploadChunkDto,
} from '../dto/media-upload.dto';
import { UploadStatus } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MediaUploadService {
  private readonly chunkSize = 5 * 1024 * 1024; // 5MB chunks
  private readonly maxFileSize = 2 * 1024 * 1024 * 1024; // 2GB max
  private readonly allowedMimeTypes = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'application/pdf',
    'application/zip',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];
  private readonly tempDir: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.tempDir = this.configService.get('TEMP_DIR', './temp');
    this.ensureTempDir();
  }

  async initiateUpload(userId: string, dto: InitiateUploadDto) {
    // Validate file size
    if (dto.fileSize > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024 * 1024)}GB`,
      );
    }

    // Validate MIME type
    if (!this.allowedMimeTypes.includes(dto.mimeType)) {
      throw new BadRequestException(
        `File type ${dto.mimeType} is not supported`,
      );
    }

    // Validate chunk count
    const expectedChunks = Math.ceil(dto.fileSize / this.chunkSize);
    if (dto.totalChunks !== expectedChunks) {
      throw new BadRequestException(
        `Invalid chunk count. Expected ${expectedChunks}, got ${dto.totalChunks}`,
      );
    }

    // Create upload session
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const uploadSession = await this.prisma.uploadSession.create({
      data: {
        id: sessionId,
        userId,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        totalChunks: dto.totalChunks,
        chunkHashes: dto.chunkHashes,
        expiresAt,
        status: UploadStatus.PENDING,
      },
    });

    // Create temp directory for this session
    const sessionDir = path.join(this.tempDir, sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    return {
      sessionId,
      chunkSize: this.chunkSize,
      totalChunks: dto.totalChunks,
      expiresAt,
    };
  }

  async uploadChunk(userId: string, dto: UploadChunkDto) {
    const session = await this.prisma.uploadSession.findUnique({
      where: { id: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundException('Upload session not found');
    }

    if (session.userId !== userId) {
      throw new BadRequestException('Unauthorized access to upload session');
    }

    if (session.status === UploadStatus.EXPIRED) {
      throw new BadRequestException('Upload session has expired');
    }

    if (session.status === UploadStatus.COMPLETED) {
      throw new BadRequestException('Upload already completed');
    }

    if (session.status === UploadStatus.FAILED) {
      throw new BadRequestException('Upload session has failed');
    }

    // Validate chunk index
    if (dto.chunkIndex >= session.totalChunks) {
      throw new BadRequestException('Invalid chunk index');
    }

    // Validate chunk hash
    const expectedHash = session.chunkHashes[dto.chunkIndex];
    if (expectedHash && expectedHash !== dto.chunkHash) {
      throw new BadRequestException('Chunk hash mismatch');
    }

    // Decode and save chunk
    const chunkData = Buffer.from(dto.chunkData, 'base64');
    const sessionDir = path.join(this.tempDir, dto.sessionId);
    const chunkPath = path.join(sessionDir, `chunk_${dto.chunkIndex}`);

    fs.writeFileSync(chunkPath, chunkData);

    // Update session status
    const updatedSession = await this.prisma.uploadSession.update({
      where: { id: dto.sessionId },
      data: {
        status: UploadStatus.UPLOADING,
        uploadedChunks: {
          increment: 1,
        },
      },
    });

    return {
      sessionId: dto.sessionId,
      uploadedChunks: updatedSession.uploadedChunks,
      totalChunks: session.totalChunks,
      progress: (updatedSession.uploadedChunks / session.totalChunks) * 100,
    };
  }

  async completeUpload(userId: string, dto: CompleteUploadDto) {
    const session = await this.prisma.uploadSession.findUnique({
      where: { id: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundException('Upload session not found');
    }

    if (session.userId !== userId) {
      throw new BadRequestException('Unauthorized access to upload session');
    }

    if (session.status === UploadStatus.EXPIRED) {
      throw new BadRequestException('Upload session has expired');
    }

    if (session.uploadedChunks !== session.totalChunks) {
      throw new BadRequestException('Not all chunks have been uploaded');
    }

    // Merge chunks
    const sessionDir = path.join(this.tempDir, dto.sessionId);
    const finalFilePath = path.join(sessionDir, session.fileName);

    try {
      await this.mergeChunks(sessionDir, finalFilePath, session.totalChunks);

      // Verify final file hash
      const finalHash = await this.calculateFileHash(finalFilePath);
      if (finalHash !== dto.finalHash) {
        throw new BadRequestException('Final file hash mismatch');
      }

      // Update session status
      await this.prisma.uploadSession.update({
        where: { id: dto.sessionId },
        data: {
          status: UploadStatus.COMPLETED,
        },
      });

      return {
        sessionId: dto.sessionId,
        fileName: session.fileName,
        fileSize: session.fileSize,
        mimeType: session.mimeType,
        filePath: finalFilePath,
        status: UploadStatus.COMPLETED,
      };
    } catch (error) {
      // Mark session as failed
      await this.prisma.uploadSession.update({
        where: { id: dto.sessionId },
        data: {
          status: UploadStatus.FAILED,
        },
      });

      // Clean up temp files
      this.cleanupSession(sessionDir);

      throw new UnprocessableEntityException(
        `Failed to complete upload: ${error.message}`,
      );
    }
  }

  async getUploadStatus(sessionId: string, userId: string) {
    const session = await this.prisma.uploadSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Upload session not found');
    }

    if (session.userId !== userId) {
      throw new BadRequestException('Unauthorized access to upload session');
    }

    return {
      sessionId: session.id,
      fileName: session.fileName,
      fileSize: session.fileSize,
      mimeType: session.mimeType,
      status: session.status,
      uploadedChunks: session.uploadedChunks,
      totalChunks: session.totalChunks,
      progress: (session.uploadedChunks / session.totalChunks) * 100,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    };
  }

  async cancelUpload(userId: string, dto: CancelUploadDto) {
    const session = await this.prisma.uploadSession.findUnique({
      where: { id: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundException('Upload session not found');
    }

    if (session.userId !== userId) {
      throw new BadRequestException('Unauthorized access to upload session');
    }

    if (session.status === UploadStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed upload');
    }

    // Clean up temp files
    const sessionDir = path.join(this.tempDir, dto.sessionId);
    this.cleanupSession(sessionDir);

    // Update session status
    await this.prisma.uploadSession.update({
      where: { id: dto.sessionId },
      data: {
        status: UploadStatus.FAILED,
      },
    });

    return {
      sessionId: dto.sessionId,
      status: UploadStatus.FAILED,
      message: 'Upload cancelled successfully',
    };
  }
  // TODO: Add a method to clean up expired sessions
  // Clean up expired sessions (should be called periodically)
  async cleanupExpiredSessions(): Promise<void> {
    const expiredSessions = await this.prisma.uploadSession.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
        status: {
          not: UploadStatus.COMPLETED,
        },
      },
    });

    for (const session of expiredSessions) {
      const sessionDir = path.join(this.tempDir, session.id);
      this.cleanupSession(sessionDir);

      await this.prisma.uploadSession.update({
        where: { id: session.id },
        data: {
          status: UploadStatus.EXPIRED,
        },
      });
    }
  }

  private ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  private async mergeChunks(
    sessionDir: string,
    finalFilePath: string,
    totalChunks: number,
  ): Promise<void> {
    const writeStream = fs.createWriteStream(finalFilePath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(sessionDir, `chunk_${i}`);

      if (!fs.existsSync(chunkPath)) {
        throw new Error(`Chunk ${i} not found`);
      }

      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
    }

    writeStream.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private cleanupSession(sessionDir: string): void {
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
  }
}
