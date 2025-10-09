import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Public } from './common/decorators/public.decorator';
import { GetCurrentUser } from './common/decorators/get-current-user.decorator';
import { GetCurrentUserId } from './common/decorators/get-current-user-id.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(
    @Body() authDto: AuthDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.signup(authDto);
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(
    @Body() authDto: AuthDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.signin(authDto);
  }

  @UseGuards(AuthGuard('access-token'))
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@GetCurrentUserId() userId: string) {
    return this.authService.logout(userId);
  }

  @Public()
  @UseGuards(AuthGuard('refresh-token'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refreshTokens(userId, refreshToken);
  }
}
