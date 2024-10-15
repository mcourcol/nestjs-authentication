import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from 'src/models/user/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/models/user/entities/user.entity';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from 'src/config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import refreshJwtConfig from 'src/config/refresh-jwt.config';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    LocalStrategy,
    JwtStrategy,
    RefreshJwtStrategy,
    // Enable global authentication guard
    {
      provide: 'APP_GUARD',
      useClass: JwtAuthGuard,
    },
  ],
})
export class AuthModule {}
