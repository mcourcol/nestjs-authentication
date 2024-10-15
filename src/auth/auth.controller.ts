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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Request() req: any) {
    const token = await this.authService.login(
      req.user.id,
      req.user.firstName,
      req.user.lastName,
    );
    return { user: req.user, token };
  }
}
