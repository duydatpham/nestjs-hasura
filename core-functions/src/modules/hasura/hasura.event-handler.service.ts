import { Injectable, Logger } from '@nestjs/common';
import { HasuraAction, HasuraEvent } from './hasura.interfaces';

@Injectable()
export class EventHandlerService {

    private readonly logger = new Logger();

    public handleEvent(evt: HasuraEvent): any {
        // The implementation for this method is overriden by the containing module
        this.logger.log(evt);
    }

    public handerAction(evt: HasuraAction): any {
        // The implementation for this method is overriden by the containing module
        this.logger.log(evt);
    }
}