import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ConfigurationUpdateCommand } from './device-command-router.service';
import { DeviceCommandRouterService } from './device-command-router.service';

export interface Configuration {
  deviceId: number;
  version: number;
  receivedAt: number;
  config: string;
}

export interface ConfigurationUpdateCommandResponse {
  deviceId: number;
  commandId: number;
  config: string;
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private commandCounter = 0;
  private readonly configurationMap = new Map<number, Configuration>();
  private readonly configurationUpdateCommandMap = new Map<
    number,
    ConfigurationUpdateCommandResponse
  >();

  constructor(
    private readonly deviceCommandRouterService: DeviceCommandRouterService,
  ) {}

  public getConfiguration(deviceId: number): Configuration {
    const config = this.configurationMap.get(deviceId);
    if (!config) {
      throw new NotFoundException();
    }
    return config;
  }

  public async updateConfiguration(
    deviceId: number,
    command: ConfigurationUpdateCommand,
  ): Promise<ConfigurationUpdateCommandResponse> {
    const config = this.getConfiguration(deviceId);
    if (command.lastSeenConfigVersion !== config.version) {
      throw new ConflictException();
    }
    if (this.configurationUpdateCommandMap.has(command.deviceId)) {
      throw new ServiceUnavailableException();
    }
    this.commandCounter++;
    const commandId = this.commandCounter;
    await this.deviceCommandRouterService.sendUpdate(command, commandId);

    const commandResponse = {
      deviceId,
      commandId,
      config: command.config,
    };
    // TODO For real usage should be failed and cleared on timeout in case configuration does not converge
    this.configurationUpdateCommandMap.set(command.deviceId, commandResponse);
    return commandResponse;
  }

  public async processConfiguration(
    configuration: Configuration,
    meta?: {
      topic?: string;
      partition?: number;
      offset?: string;
      key?: string;
      headers?: Record<string, string | string[] | undefined>;
    },
  ): Promise<void> {
    this.logger.debug(
      `Received configuration ${JSON.stringify(configuration)}`,
    );
    this.configurationMap.set(configuration.deviceId, configuration);

    const updateCommand = this.configurationUpdateCommandMap.get(configuration.deviceId);
    if (updateCommand && updateCommand.config === configuration.config) {
      this.logger.debug(
        `Configuration converged for command ${updateCommand.commandId}`,
      );
      this.configurationUpdateCommandMap.delete(configuration.deviceId);
    }
  }
}
