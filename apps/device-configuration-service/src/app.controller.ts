import { Body, Controller, Get, HttpCode, Logger, Param, ParseIntPipe, Put } from '@nestjs/common';
import type {
  Configuration,
  ConfigurationUpdateCommandResponse,
} from './app.service';
import { AppService } from './app.service';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import type { ConfigurationUpdateCommand } from './device-command-router.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  public getHealth(): { status: string } {
    this.logger.debug('/health');
    return {
      status: 'ok',
    };
  }

  @Get('/configuration/:deviceId')
  public getConfiguration(@Param('deviceId', ParseIntPipe) deviceId: number): Configuration {
    return this.appService.getConfiguration(deviceId);
  }

  @Put('/configuration/:deviceId')
  @HttpCode(202)
  public async updateConfiguration(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body() command: ConfigurationUpdateCommand,
  ): Promise<ConfigurationUpdateCommandResponse> {
    return await this.appService.updateConfiguration(deviceId, command);
  }

  @EventPattern('warmhouse.ingress.configuration.processed')
  public async handleConfigurationProcessed(
    @Payload() message: Configuration,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    await this.appService.processConfiguration(message, {
      topic: context.getTopic(),
      partition: context.getPartition(),
      offset: context.getMessage().offset,
      key: context.getMessage().key?.toString(),
      headers: Object.fromEntries(
        Object.entries(context.getMessage().headers ?? {}).map(([k, v]) => [
          k,
          Array.isArray(v) ? v.map((x) => x?.toString()) : v?.toString(),
        ]),
      ),
    });
  }
}
