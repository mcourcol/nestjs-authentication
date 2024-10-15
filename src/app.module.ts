import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DummyModule } from './models/dummy/dummy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DummyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
