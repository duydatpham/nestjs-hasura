import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from './../config';
import { ClientProxy, MessagePattern } from '@nestjs/microservices';

@Injectable()
export class AppService {
  constructor(
    private config: ConfigService,
  ) { }

  async root() {
    return this.config.get('APP_URL');
  }

}
