import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { AuthJwtPayload } from 'src/common/types/auth-jwt-payload';
import refreshJwtConfig from 'src/config/refresh-jwt.config';
import { UserService } from 'src/models/user/user.service';
import * as argon2 from 'argon2';

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
    const { accessToken, refreshToken } = await this.generateTokens(
      userId,
      firstName,
      lastName,
    );
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.userService.updateRefreshToken(userId, hashedRefreshToken);
    return { accessToken, refreshToken };
  }

  async generateTokens(userId: number, firstName: string, lastName: string) {
    const payload: AuthJwtPayload = {
      sub: userId,
      name: `${firstName} ${lastName}`,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshTokenConfig),
    ]);
    return { accessToken, refreshToken };
  }

  async refreshToken(
    userId: number,
    firstName: string,
    lastName: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { accessToken, refreshToken } = await this.generateTokens(
      userId,
      firstName,
      lastName,
    );
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.userService.updateRefreshToken(userId, hashedRefreshToken);
    return { accessToken, refreshToken };
  }

  async validateRefreshToken(userId: number, refreshToken: string) {
    const user = await this.userService.findOne(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const isRefreshTokenValid = await argon2.verify(
      user.refreshToken,
      refreshToken,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { id: user.id, name: `${user.firstName} ${user.lastName}` };
  }

  async signOut(userId: number) {
    await this.userService.updateRefreshToken(userId, null);
  }
}
