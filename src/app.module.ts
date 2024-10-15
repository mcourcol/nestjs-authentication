import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DummyModule } from './models/dummy/dummy.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { sqliteConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(sqliteConfig),
    DummyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
