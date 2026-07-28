import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { OAuthService } from './oauth.service';
import { Public } from '../../common/decorators/public.decorator';
import { RedisService } from '../../redis/redis.service';

@Controller('auth')
export class OAuthController {
  constructor(
    private oauthService: OAuthService,
    private redisService: RedisService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const ipAddress = req.ip || 'unknown';
    const key = `ratelimit:oauth:google:${ipAddress}`;
    const count = await this.redisService.incr(key);
    if (count === 1) await this.redisService.expire(key, 60);
    if (count > 10) {
      throw new HttpException(
        { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // NOTE: CSRF state validation is handled by Passport's built-in state parameter
    // (configured via `state: true` in the strategy + express-session in app.config.ts).
    // The Redis-based manual check was removed because it was never populated,
    // causing false OAUTH_INVALID_STATE errors.

    // V45 FIX: validate that passport populated req.user
    if (!req.user || !(req.user as any).providerId) {
      throw new BadRequestException({
        code: 'OAUTH_PROFILE_MISSING',
        message: 'OAuth profile was not provided by the strategy',
      });
    }
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const result = await this.oauthService.handleOAuthLogin(req.user as any, ipAddress, userAgent);
    // Handle 2FA challenge case
    if ('requiresTwoFactor' in result && result.requiresTwoFactor) {
      return res.redirect(`http://localhost:3001/login?error=2fa_required&challengeToken=${result.challengeToken}`);
    }
    // Redirect to frontend with tokens as query params
    const tokens = result as { accessToken: string; refreshToken: string };
    res.redirect(`http://localhost:3001/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  }

  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {}

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const key = `ratelimit:oauth:github:${ipAddress}`;
    const count = await this.redisService.incr(key);
    if (count === 1) await this.redisService.expire(key, 60);
    if (count > 10) {
      throw new HttpException(
        { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // NOTE: CSRF state validation is handled by Passport's built-in state parameter
    // (configured via `state: true` in the strategy + express-session in app.config.ts).

    // V45 FIX: validate that passport populated req.user
    if (!req.user || !(req.user as any).providerId) {
      throw new BadRequestException({
        code: 'OAUTH_PROFILE_MISSING',
        message: 'OAuth profile was not provided by the strategy',
      });
    }
    const result = await this.oauthService.handleOAuthLogin(req.user as any, ipAddress, userAgent);
    // Handle 2FA challenge case
    if ('requiresTwoFactor' in result && result.requiresTwoFactor) {
      return res.redirect(`http://localhost:3001/login?error=2fa_required&challengeToken=${result.challengeToken}`);
    }
    // Redirect to frontend with tokens as query params
    const tokens = result as { accessToken: string; refreshToken: string };
    res.redirect(`http://localhost:3001/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  }
}
