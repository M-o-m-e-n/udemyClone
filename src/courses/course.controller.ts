import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/course.dto';
import { AccessTokenGuard } from '../auth/common/guards/access-token.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetCurrentUserId } from '../auth/common/decorators/get-current-user-id.decorator';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @UseGuards(RolesGuard) // ✅ ONLY RolesGuard - AccessTokenGuard is already global
  @Roles(Role.INSTRUCTOR)
  @HttpCode(HttpStatus.CREATED)
  async createCourse(
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateCourseDto,
  ) {
    console.log('=== CONTROLLER REACHED ===');
    console.log('User ID:', userId);
    console.log('DTO:', dto);
    console.log('=========================');
    
    return this.courseService.createCourse(userId, dto);
  }

  //
  // @Public()
  // @Get()
  // async getAllCourses(@Query() query: GetCourseQueryDto) {
  //   return this.courseService.getAllCourses(query);
  // }
  //
  //   /**
  //    * Get course by ID or slug (Public)
  //    */
  //   @Public()
  //   @Get(':id')
  //   async getCourseById(
  //     @Param('id') id: string,
  //     @GetCurrentUserId() userId?: string,
  //   ) {
  //     return this.courseService.getCourseById(id, userId);
  //   }
  //
  //   /**
  //    * Update course (Instructor/Admin)
  //    */
  //   @Put(':id')
  //   @UseGuards(AccessTokenGuard)
  //   async updateCourse(
  //     @Param('id') id: string,
  //     @GetCurrentUserId() userId: string,
  //     @GetCurrentUser('role') role: Role,
  //     @Body() dto: UpdateCourseDto,
  //   ) {
  //     return this.courseService.updateCourse(id, userId, role, dto);
  //   }
  //
  //   /**
  //    * Delete course (Instructor/Admin)
  //    */
  //   @Delete(':id')
  //   @UseGuards(AccessTokenGuard)
  //   @HttpCode(HttpStatus.NO_CONTENT)
  //   async deleteCourse(
  //     @Param('id') id: string,
  //     @GetCurrentUserId() userId: string,
  //     @GetCurrentUser('role') role: Role,
  //   ) {
  //     return this.courseService.deleteCourse(id, userId, role);
  //   }
  //
  //   /**
  //    * Publish/Unpublish course
  //    */
  //   @Put(':id/publish')
  //   @UseGuards(AccessTokenGuard)
  //   async publishCourse(
  //     @Param('id') id: string,
  //     @GetCurrentUserId() userId: string,
  //     @GetCurrentUser('role') role: Role,
  //     @Body() dto: PublishCourseDto,
  //   ) {
  //     return this.courseService.publishCourse(id, userId, role, dto);
  //   }
  //
  //   // ==================== SECTION ENDPOINTS ====================
  //
  //   /**
  //    * Create section
  //    */
  //   @Post(':courseId/sections')
  //   @UseGuards(AccessTokenGuard, RolesGuard)
  //   @Roles(Role.INSTRUCTOR)
  //   @HttpCode(HttpStatus.CREATED)
  //   async createSection(
  //     @Param('courseId') courseId: string,
  //     @GetCurrentUserId() userId: string,
  //     @Body() dto: CreateSectionDto,
  //   ) {
  //     return this.courseService.createSection(courseId, userId, dto);
  //   }
  //
  //   /**
  //    * Update section
  //    */
  //   @Put('sections/:sectionId')
  //   @UseGuards(AccessTokenGuard, RolesGuard)
  //   @Roles(Role.INSTRUCTOR)
  //   async updateSection(
  //     @Param('sectionId') sectionId: string,
  //     @GetCurrentUserId() userId: string,
  //     @Body() dto: UpdateSectionDto,
  //   ) {
  //     return this.courseService.updateSection(sectionId, userId, dto);
  //   }
  //
  //   /**
  //    * Delete section
  //    */
  //   @Delete('sections/:sectionId')
  //   @UseGuards(AccessTokenGuard, RolesGuard)
  //   @Roles(Role.INSTRUCTOR)
  //   @HttpCode(HttpStatus.NO_CONTENT)
  //   async deleteSection(
  //     @Param('sectionId') sectionId: string,
  //     @GetCurrentUserId() userId: string,
  //   ) {
  //     return this.courseService.deleteSection(sectionId, userId);
  //   }
  //
  //   // ==================== LECTURE ENDPOINTS ====================
  //
  //   /**
  //    * Create lecture
  //    */
  //   @Post('sections/:sectionId/lectures')
  //   @UseGuards(AccessTokenGuard, RolesGuard)
  //   @Roles(Role.INSTRUCTOR)
  //   @HttpCode(HttpStatus.CREATED)
  //   async createLecture(
  //     @Param('sectionId') sectionId: string,
  //     @GetCurrentUserId() userId: string,
  //     @Body() dto: CreateLectureDto,
  //   ) {
  //     return this.courseService.createLecture(sectionId, userId, dto);
  //   }
  //
  //   /**
  //    * Update lecture
  //    */
  //   @Put('lectures/:lectureId')
  //   @UseGuards(AccessTokenGuard, RolesGuard)
  //   @Roles(Role.INSTRUCTOR)
  //   async updateLecture(
  //     @Param('lectureId') lectureId: string,
  //     @GetCurrentUserId() userId: string,
  //     @Body() dto: UpdateLectureDto,
  //   ) {
  //     return this.courseService.updateLecture(lectureId, userId, dto);
  //   }
  //
  //   /**
  //    * Delete lecture
  //    */
  //   @Delete('lectures/:lectureId')
  //   @UseGuards(AccessTokenGuard, RolesGuard)
  //   @Roles(Role.INSTRUCTOR)
  //   @HttpCode(HttpStatus.NO_CONTENT)
  //   async deleteLecture(
  //     @Param('lectureId') lectureId: string,
  //     @GetCurrentUserId() userId: string,
  //   ) {
  //     return this.courseService.deleteLecture(lectureId, userId);
  //   }
  //
  //   /**
  //    * Get lecture playback (Enrolled students or free lectures)
  //    */
  //   @Get('lectures/:lectureId/play')
  //   @UseGuards(AccessTokenGuard)
  //   async getLecturePlayback(
  //     @Param('lectureId') lectureId: string,
  //     @GetCurrentUserId() userId: string,
  //   ) {
  //     return this.courseService.getLecturePlayback(lectureId, userId);
  //   }
}
