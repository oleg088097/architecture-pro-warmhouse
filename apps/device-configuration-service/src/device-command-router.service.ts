import {
  Injectable, InternalServerErrorException,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';

export interface ConfigurationUpdateCommand {
  deviceId: number;
  lastSeenConfigVersion: number;
  config: string;
}

@Injectable()
export class DeviceCommandRouterService {
  private readonly logger = new Logger(DeviceCommandRouterService.name);

  public async sendUpdate(command: ConfigurationUpdateCommand, commandId: number): Promise<void> {
    const baseUrl =
      process.env.DEVICE_COMMAND_ROUTER_URL ??
      'http://device-command-router';
    const url = `${baseUrl}/device/${encodeURIComponent(command.deviceId)}/config`;

    const payload = {
      deviceId: command.deviceId,
      config: command.config,
      commandId,
    };

    this.logger.debug(
      `Sending configuration update to device-command-router: ${url}`,
    );
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.error(
        `device-command-router responded with ${response.status}: ${text}`,
      );
      throw new InternalServerErrorException(
        `Failed to send update to device-command-router: ${response.status}`,
      );
    }
  }
}
