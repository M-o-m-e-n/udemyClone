import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { CourseController } from './controllers/course.controller';
import { MediaUploadController } from './controllers/media-upload.controller';
import { CourseService } from './services/course.service';
import { MediaUploadService } from './services/media-upload.service';
import { VideoProcessingService } from './services/video-processing.service';
import { VideoProcessingProcessor } from './processors/video-processing.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    BullModule.registerQueue({
      name: 'video-processing',
    }),
  ],
  controllers: [CourseController, MediaUploadController],
  providers: [
    CourseService,
    MediaUploadService,
    VideoProcessingService,
    VideoProcessingProcessor,
    RolesGuard,
  ],
  exports: [CourseService, MediaUploadService, VideoProcessingService],
})
export class CourseModule {}
