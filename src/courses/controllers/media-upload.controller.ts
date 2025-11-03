import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MediaUploadService } from '../services/media-upload.service';
import {
  CompleteUploadDto,
  InitiateUploadDto,
  UploadChunkDto,
} from '../dto/media-upload.dto';
import { GetCurrentUserId } from '../../auth/common/decorators/get-current-user-id.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ZodValidationPipe } from 'nestjs-zod';

@Controller('media')
@UseGuards(RolesGuard)
@Roles(Role.INSTRUCTOR, Role.ADMIN)
export class MediaUploadController {
  constructor(private readonly mediaUploadService: MediaUploadService) {}

  @Post('upload/initiate')
  @HttpCode(HttpStatus.CREATED)
  async initiateUpload(
    @GetCurrentUserId() userId: string,
    @Body(ZodValidationPipe) dto: InitiateUploadDto,
  ) {
    return this.mediaUploadService.initiateUpload(userId, dto);
  }

  @Post('upload/chunk')
  @HttpCode(HttpStatus.OK)
  async uploadChunk(
    @GetCurrentUserId() userId: string,
    @Body(ZodValidationPipe) dto: UploadChunkDto,
  ) {
    return this.mediaUploadService.uploadChunk(userId, dto);
  }

  @Post('upload/complete')
  @HttpCode(HttpStatus.OK)
  async completeUpload(
    @GetCurrentUserId() userId: string,
    @Body(ZodValidationPipe) dto: CompleteUploadDto,
  ) {
    return this.mediaUploadService.completeUpload(userId, dto);
  }

  @Get('upload/status/:sessionId')
  async getUploadStatus(
    @Param('sessionId') sessionId: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.mediaUploadService.getUploadStatus(sessionId, userId);
  }

  @Delete('upload/:sessionId')
  @HttpCode(HttpStatus.OK)
  async cancelUpload(
    @Param('sessionId') sessionId: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.mediaUploadService.cancelUpload(userId, { sessionId });
  }
}
