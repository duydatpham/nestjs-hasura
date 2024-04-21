import {
  Controller,
  Body,
  Post,
  HttpCode,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './';
import { UsersService } from './../user';
import { HasuraHookAuthen } from 'modules/hasura/hasura.interfaces';
import { Response } from 'express';

@Controller('api/auth')
@ApiTags('authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Post('hook')
  @HttpCode(200)
  async authHook(@Body() evt: HasuraHookAuthen, @Res() res: Response): Promise<any> {
    // this.logger.log(evt.headers)
    // this.logger.log(evt.request)

    const { headers } = evt
    let authorization = headers['Authorization'] || headers['authorization']

    console.log('headers::Authorization', authorization)
    try {
      if (!!authorization) {
        let idToken = authorization?.replace('Bearer ', '');


      }
    } catch (error) {
      return res.status(401).json({
        message: 'Het han token',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(200).json({
      "X-Hasura-Role": "anonymous",
    })
  }
}
