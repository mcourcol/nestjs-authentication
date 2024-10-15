import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../common/guards/local-auth.guard';
import { RefreshJwtAuthGuard } from 'src/common/guards/refresh-jwt-auth.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Request() req: any) {
    const tokens = await this.authService.login(
      req.user.id,
      req.user.firstName,
      req.user.lastName,
    );
    return { user: req.user, tokens };
  }

  @UseGuards(RefreshJwtAuthGuard)
  @Post('refresh')
  refreshToken(@Request() req: any) {
    return this.authService.refreshToken(
      req.user.id,
      req.user.firstName,
      req.user.lastName,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('signout')
  async signout(@Request() req: any) {
    await this.authService.signOut(req.user.id);
  }
}
