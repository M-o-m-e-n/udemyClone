import { ForbiddenException, Injectable } from '@nestjs/common';
import { SignInDto, SignUpDto } from './dto/auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshToken, Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(signUpDto: SignUpDto) {
    const { email, password, role, firstName, lastName } = signUpDto;
    try {
      const hashedPassword = await argon.hash(password);

      const newUser = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          firstName,
          lastName,
        },
      });

      const tokens = await this.getTokens(
        newUser.id,
        newUser.email,
        newUser.role,
      );
      await this.updateRefreshToken(newUser.id, tokens.refreshToken);

      return {
        ...tokens,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email already exists');
        }
      }
      throw error;
    }
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;
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

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
    });
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        refreshTokens: true,
      },
    });

    if (!user || !user.refreshTokens || user.refreshTokens.length === 0) {
      throw new ForbiddenException('Access denied');
    }

    let isValid = false;
    let validToken: RefreshToken | null = null;

    for (const storedToken of user.refreshTokens) {
      const isMatch = await argon.verify(storedToken.token, refreshToken);
      if (isMatch && storedToken.expiresAt > new Date()) {
        isValid = true;
        validToken = storedToken;
        break;
      }
    }

    if (!isValid || !validToken) {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({
      where: { id: validToken.id },
    });

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async getTokens(userId: string, email: string, role: Role) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await argon.hash(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: hashedRefreshToken,
        userId,
        expiresAt,
      },
    });
  }
}
