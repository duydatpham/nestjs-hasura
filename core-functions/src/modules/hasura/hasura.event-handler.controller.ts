import { Body, Controller, HttpCode, Logger, Post, Res, UseGuards } from '@nestjs/common';
import { EventHandlerService } from './hasura.event-handler.service';
import { HasuraAction, HasuraEvent } from './hasura.interfaces';
import { Response } from 'express';

@Controller('/hasura')
export class EventHandlerController {

  private readonly logger = new Logger(EventHandlerController.name);

  constructor(private readonly eventHandlerService: EventHandlerService) { }

  @Post('/events')
  @HttpCode(202)
  async handleEvent(@Body() evt: HasuraEvent) {
    const response = await this.eventHandlerService.handleEvent(evt);
    return response == undefined ? { success: true } : response;
  }

  @Post('/actions')
  @HttpCode(200)
  async handleAction(@Body() evt: HasuraAction, @Res() res: Response) {
    try {
      const response = await this.eventHandlerService.handerAction(evt);
      this.logger.log(response);
      res.status(200).json(response)
      return response == undefined ? { success: true } : response;
    } catch (error) {
      this.logger.error(error);
      let message = (typeof error == "string")?error:error.message
      res.status(400).json({ message: message });
    }
  }
}