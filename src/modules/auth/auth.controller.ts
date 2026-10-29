import {
  Controller,
  Post,
  Body,
  Request,
  Res,
  Query,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService, IssuedSession } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyLoginCodeDto, ResendLoginCodeDto } from './dto/login-code.dto';
import { REFRESH_COOKIE, clearAuthCookies, readCookie, setAuthCookies } from './auth-cookies';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Sets the httpOnly cookies. Tokens stay in the body during the transition (mobile app, sockets). */
  private withCookies(res: Response, session: IssuedSession) {
    setAuthCookies(res, session.accessToken, session.refreshToken);
    return session;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login step 1: check password, email a 6-digit code' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.authService.startLogin(user);
  }

  @Post('login/verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login step 2: verify the emailed code and start the session' })
  async verifyLoginCode(@Body() body: VerifyLoginCodeDto, @Res({ passthrough: true }) res: Response) {
    const session = await this.authService.verifyLoginCode(body.challengeToken, body.code);
    return this.withCookies(res, session);
  }

  @Post('login/resend-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a new login code' })
  async resendLoginCode(@Body() body: ResendLoginCodeDto) {
    return this.authService.resendLoginCode(body.challengeToken);
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration (sends an email verification link)' })
  async register(@Body() registerDto: RegisterDto, @Query('redirect') redirect?: string) {
    return this.authService.register(registerDto, redirect);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a new email verification link' })
  async resendVerification(@Body() body: { email: string; redirect?: string }) {
    return this.authService.resendVerification(body?.email, body?.redirect);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with the token from the emailed link' })
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body?.token);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token (refresh cookie or body)' })
  async refresh(
    @Request() req,
    @Body('refreshToken') bodyToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = bodyToken || readCookie(req, REFRESH_COOKIE);
    try {
      const session = await this.authService.refreshToken(refreshToken);
      return this.withCookies(res, session);
    } catch (err) {
      clearAuthCookies(res);
      throw err;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout (works with an expired access token too)' })
  async logout(@Request() req, @Body('refreshToken') bodyToken: string, @Res({ passthrough: true }) res: Response) {
    const refreshToken = bodyToken || readCookie(req, REFRESH_COOKIE);
    if (refreshToken) {
      await this.authService.logoutByRefreshToken(refreshToken);
    }
    clearAuthCookies(res);
    return { message: 'Logged out successfully' };
  }

  @Post('forget-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email (alias)' })
  async forgetPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset or set password using the emailed token' })
  async resetPassword(@Body() body: { password: string; resetToken?: string; token?: string }) {
    const token = body.resetToken || body.token;
    return this.authService.resetPassword(body.password, token!);
  }
}
