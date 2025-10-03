import { Injectable } from '@nestjs/common';
import { sharedConstants } from '@repo/shared';

@Injectable()
export class AppService {
  getHello(): string {
    return `Hello from ${sharedConstants.appName}!`;
  }
}
