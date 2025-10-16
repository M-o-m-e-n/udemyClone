import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { CourseService } from './course.service';
import {
  CreateCourseDto,
  GetCourseQueryDto,
  PublishCourseDto,
  UpdateCourseDto,
} from './dto/course.dto';
import { CreateSectionDto, UpdateSectionDto } from './dto/section.dto';
import { CreateLectureDto, UpdateLectureDto } from './dto/lecture.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetCurrentUserId } from '../auth/common/decorators/get-current-user-id.decorator';
import { GetCurrentUser } from '../auth/common/decorators/get-current-user.decorator';
import { Public } from '../auth/common/decorators/public.decorator';
import { ZodValidationPipe } from 'nestjs-zod';

@Controller('courses')
@UsePipes(ZodValidationPipe)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  // ==================== COURSE ENDPOINTS ====================

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @HttpCode(HttpStatus.CREATED)
  async createCourse(
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateCourseDto,
  ) {
    return this.courseService.createCourse(userId, dto);
  }

  @Public()
  @Get()
  async getAllCourses(@Query() query: GetCourseQueryDto) {
    return this.courseService.getAllCourses(query);
  }
  // Todo: make it public
  // Not public, but accessible to all roles (because of RolesGuard)
  // when I make it public, the userId will be undefined and I won't be able
  // to check if the user is enrolled in the course
  // and return additional information accordingly
  // If no user is logged in, userId will be undefined
  // and the service will handle it accordingly
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.STUDENT)
  @Get(':id')
  async getCourseById(
    @Param('id') id: string,
    @GetCurrentUserId() userId?: string,
  ) {
    return this.courseService.getCourseById(id, userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Put(':id')
  async updateCourse(
    @Param('id') id: string,
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('role') role: Role,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.courseService.updateCourse(id, userId, role, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourse(
    @Param('id') id: string,
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('role') role: Role,
  ) {
    return this.courseService.deleteCourse(id, userId, role);
  }

  @Put(':id/publish')
  async publishCourse(
    @Param('id') id: string,
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('role') role: Role,
    @Body() dto: PublishCourseDto,
  ) {
    return this.courseService.publishCourse(id, userId, role, dto);
  }

  // ==================== SECTION ENDPOINTS ====================

  @Post(':courseId/sections')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @HttpCode(HttpStatus.CREATED)
  async createSection(
    @Param('courseId') courseId: string,
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.courseService.createSection(courseId, userId, dto);
  }

  @Put('sections/:sectionId')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR)
  async updateSection(
    @Param('sectionId') sectionId: string,
    @GetCurrentUserId() userId: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.courseService.updateSection(sectionId, userId, dto);
  }

  @Delete('sections/:sectionId')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSection(
    @Param('sectionId') sectionId: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.courseService.deleteSection(sectionId, userId);
  }

  // ==================== LECTURE ENDPOINTS ====================

  @Post('sections/:sectionId/lectures')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @HttpCode(HttpStatus.CREATED)
  async createLecture(
    @Param('sectionId') sectionId: string,
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateLectureDto,
  ) {
    return this.courseService.createLecture(sectionId, userId, dto);
  }

  @Put('lectures/:lectureId')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR)
  async updateLecture(
    @Param('lectureId') lectureId: string,
    @GetCurrentUserId() userId: string,
    @Body() dto: UpdateLectureDto,
  ) {
    return this.courseService.updateLecture(lectureId, userId, dto);
  }

  @Delete('lectures/:lectureId')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLecture(
    @Param('lectureId') lectureId: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.courseService.deleteLecture(lectureId, userId);
  }

  @Get('lectures/:lectureId/play')
  async getLecturePlayback(
    @Param('lectureId') lectureId: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.courseService.getLecturePlayback(lectureId, userId);
  }
}
