import { Injectable, ForbiddenException } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async signup(authDto: AuthDto) {
    const { email, password } = authDto;
    try {
      const hashedPassword = await argon.hash(password);

      const newUser = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      return this.getTokens(newUser.id, newUser.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email already exists');
        }
      }
      throw error;
    }
  }
  async signin(authDto: AuthDto) {
    const { email, password } = authDto;
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const isPasswordValid = await argon.verify(user.password, password);
    if (!isPasswordValid) {
      throw new ForbiddenException('Invalid credentials');
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }
  async logout(userId: string) {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        refreshToken: {
          not: null,
        },
      },
      data: {
        refreshToken: null,
      },
    });
    return { message: 'Logged out successfully' };
  }
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access denied');
    }

    const isRefreshTokenValid = await argon.verify(
      user.refreshToken,
      refreshToken,
    );
    if (!isRefreshTokenValid) {
      throw new ForbiddenException('Invalid refresh token');
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async getTokens(userId: string, email: string) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: '15m',
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: '7d',
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await argon.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });
  }
}
