import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ResourceTypeEnum = z.enum([
  'PDF',
  'ZIP',
  'DOC',
  'DOCX',
  'PPT',
  'PPTX',
  'XLS',
  'XLSX',
  'TXT',
  'OTHER',
]);

export const UploadStatusEnum = z.enum([
  'PENDING',
  'UPLOADING',
  'COMPLETED',
  'FAILED',
  'EXPIRED',
]);

export const ProcessingStatusEnum = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);

// Initiate upload session
export const initiateUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
  totalChunks: z.number().int().positive('Total chunks must be positive'),
  chunkHashes: z.array(z.string()).min(1, 'Chunk hashes are required'),
});

export const uploadChunkSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  chunkIndex: z.number().int().min(0, 'Chunk index must be non-negative'),
  chunkData: z.string().min(1, 'Chunk data is required'),
  chunkHash: z.string().min(1, 'Chunk hash is required'),
});

export const completeUploadSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  finalHash: z.string().min(1, 'Final hash is required'),
});

export const getUploadStatusSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
});

export const cancelUploadSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
});

export const createResourceSchema = z.object({
  name: z
    .string()
    .min(1, 'Resource name is required')
    .max(255, 'Resource name too long'),
  url: z.string().url('Invalid resource URL'),
  type: ResourceTypeEnum,
  size: z.number().int().positive('Resource size must be positive'),
});

export const updateResourceSchema = z.object({
  name: z
    .string()
    .min(1, 'Resource name is required')
    .max(255, 'Resource name too long')
    .optional(),
  url: z.string().url('Invalid resource URL').optional(),
  type: ResourceTypeEnum.optional(),
  size: z.number().int().positive('Resource size must be positive').optional(),
});

export class InitiateUploadDto extends createZodDto(initiateUploadSchema) {}
export class UploadChunkDto extends createZodDto(uploadChunkSchema) {}
export class CompleteUploadDto extends createZodDto(completeUploadSchema) {}
export class GetUploadStatusDto extends createZodDto(getUploadStatusSchema) {}
export class CancelUploadDto extends createZodDto(cancelUploadSchema) {}
export class CreateResourceDto extends createZodDto(createResourceSchema) {}
export class UpdateResourceDto extends createZodDto(updateResourceSchema) {}
