import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DummyModule } from './models/dummy/dummy.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { sqliteConfig } from './config/database.config';
import { UserModule } from './models/user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(sqliteConfig),
    DummyModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
