import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DeviceCommandRouterService } from './device-command-router.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [DeviceCommandRouterService, AppService],
})
export class AppModule {}
