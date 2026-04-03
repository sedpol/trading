import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      name: 'Trading API',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

