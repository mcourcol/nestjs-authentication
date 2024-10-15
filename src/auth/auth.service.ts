import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { AuthJwtPayload } from 'src/common/types/auth-jwt-payload';
import refreshJwtConfig from 'src/config/refresh-jwt.config';
import { UserService } from 'src/models/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && (await compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(
    userId: number,
    firstName: string,
    lastName: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: AuthJwtPayload = {
      sub: userId,
      name: `${firstName} ${lastName}`,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, this.refreshTokenConfig);
    return { accessToken, refreshToken };
  }

  async refreshToken(
    userId: number,
    firstName: string,
    lastName: string,
  ): Promise<{ accessToken: string }> {
    const payload: AuthJwtPayload = {
      sub: userId,
      name: `${firstName} ${lastName}`,
    };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }
}
