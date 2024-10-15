import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { AuthJwtPayload } from 'src/common/types/auth-jwt-payload';
import { UserService } from 'src/models/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
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
  ): Promise<string> {
    const payload: AuthJwtPayload = {
      sub: userId,
      name: `${firstName} ${lastName}`,
    };
    return this.jwtService.sign(payload);
  }
}
