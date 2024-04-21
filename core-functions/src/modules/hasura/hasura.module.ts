import { DiscoveryModule, DiscoveryService } from '@golevelup/nestjs-discovery';
import { createConfigurableDynamicRootModule } from '@golevelup/nestjs-modules';
import {
  BadRequestException,
  Logger,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { flatten, groupBy } from 'lodash';
import {
  HASURA_EVENT_HANDLER,
  HASURA_MODULE_CONFIG,
  HASURA_SCHEDULED_EVENT_HANDLER,
} from './hasura.constants';
import { InjectHasuraConfig } from './hasura.decorators';
import { EventHandlerController } from './hasura.event-handler.controller';
import { EventHandlerService } from './hasura.event-handler.service';
import { HASURA_ACTION_HANDLER } from './hasura.constants';
import { HasuraAction, HasuraActionHandlerConfig } from './hasura.interfaces';
import {
  HasuraEvent,
  HasuraEventHandlerConfig,
  HasuraModuleConfig,
  HasuraScheduledEventPayload,
  TrackedHasuraEventHandlerConfig,
  TrackedHasuraScheduledEventHandlerConfig,
} from './hasura.interfaces';

function isHasuraEvent(value: any): value is HasuraEvent {
  return ['trigger', 'table', 'event'].every((it) => it in value);
}

function isHasuraAction(value: any): value is HasuraAction {
  return ['session_variables', 'input', 'action'].every((it) => it in value);
}

function isHasuraScheduledEventPayload(
  value: any
): value is HasuraScheduledEventPayload {
  return ['name', 'scheduled_time', 'payload'].every((it) => it in value);
}

@Module({
  imports: [DiscoveryModule],
  controllers: [EventHandlerController],
})
export class HasuraModule
  extends createConfigurableDynamicRootModule<HasuraModule, HasuraModuleConfig>(
    HASURA_MODULE_CONFIG,
    {
      providers: [
        {
          provide: Symbol('CONTROLLER_HACK'),
          useFactory: (config: HasuraModuleConfig) => {
            const controllerPrefix = config.controllerPrefix || 'hasura';

            Reflect.defineMetadata(
              PATH_METADATA,
              controllerPrefix,
              EventHandlerController
            );
            config.decorators?.forEach((deco) => {
              deco(EventHandlerController);
            });
          },
          inject: [HASURA_MODULE_CONFIG],
        },
        EventHandlerService,
      ],
    }
  )
  implements OnModuleInit {
  private readonly logger = new Logger(HasuraModule.name);

  constructor(
    private readonly discover: DiscoveryService,
    private readonly externalContextCreator: ExternalContextCreator,
    @InjectHasuraConfig()
    private readonly hasuraModuleConfig: HasuraModuleConfig
  ) {
    super();
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public async onModuleInit() {
    this.logger.log('Initializing Hasura Module');
    const [eventHandlerServiceInstance] = await (
      await this.discover.providers((x) => x.name === EventHandlerService.name)
    ).map((x) => x.instance);
    const eventHandlerService = eventHandlerServiceInstance as EventHandlerService;
    const handleEvent = await this.discoveryEventHanders();
    const handleAction = await this.discoveryActionHanders();
    eventHandlerService.handleEvent = handleEvent;
    eventHandlerService.handerAction = handleAction;
  }


  public async discoveryEventHanders() {
    const eventHandlerMeta = await this.discover.providerMethodsWithMetaAtKey<
      HasuraEventHandlerConfig
    >(HASURA_EVENT_HANDLER);

    const trackedEventHandlerMeta = await this.discover.providerMethodsWithMetaAtKey<
      HasuraEventHandlerConfig | TrackedHasuraEventHandlerConfig
    >(HASURA_EVENT_HANDLER);

    const trackedScheduledEventHandlerMeta = await this.discover.providerMethodsWithMetaAtKey<
      TrackedHasuraScheduledEventHandlerConfig
    >(HASURA_SCHEDULED_EVENT_HANDLER);

    if (!eventHandlerMeta.length) {
      this.logger.log('No Hasura event handlers were discovered');
      return;
    }

    this.logger.log(
      `Discovered ${eventHandlerMeta.length} hasura event handlers`
    );

    const grouped = groupBy(
      eventHandlerMeta,
      (x) => x.discoveredMethod.parentClass.name
    );

    const eventHandlers = flatten(
      Object.keys(grouped).map((x) => {
        this.logger.log(`Registering hasura event handlers from ${x}`);

        return grouped[x].map(({ discoveredMethod, meta: config }) => {
          return {
            key: config.triggerName,
            handler: this.externalContextCreator.create(
              discoveredMethod.parentClass.instance,
              discoveredMethod.handler,
              discoveredMethod.methodName
            ),
          };
        });
      })
    );

    const handleEvent = (
      evt: Partial<HasuraEvent> | HasuraScheduledEventPayload
    ) => {
      const keys = isHasuraEvent(evt)
        ? [evt.trigger?.name, `${evt?.table?.schema}-${evt?.table?.name}`]
        : isHasuraScheduledEventPayload(evt)
        ? [evt.name]
        : null;
      if (!keys) throw new Error('Not a Hasura Event');

      // TODO: this should use a map for faster lookups
      const handlers = eventHandlers.filter((x) => keys.includes(x.key));

      if (this.hasuraModuleConfig.enableEventLogs) {
        this.logger.log(`Received event for: ${keys}`);
      }

      if (handlers && handlers.length) {
        return Promise.all(handlers.map((x) => x.handler(evt)));
      } else {
        const errorMessage = `Handler not found for ${keys}`;
        this.logger.error(errorMessage);
        throw new BadRequestException(errorMessage);
      }
    };

    return handleEvent;
  }

  public async discoveryActionHanders() {
    const actionHandlerMeta = await this.discover.providerMethodsWithMetaAtKey<
      HasuraActionHandlerConfig
    >(HASURA_ACTION_HANDLER);

    if (!actionHandlerMeta.length) {
      this.logger.log('No Hasura action handlers were discovered');
      return;
    }

    this.logger.log(
      `Discovered ${actionHandlerMeta.length} hasura action handlers`
    );
    
    const grouped = groupBy(
      actionHandlerMeta,
      (x) => x.discoveredMethod.parentClass.name
    );
    
    const actionHandlers = flatten(
      Object.keys(grouped).map((x) => {
        this.logger.log(`Registering hasura action handlers from ${x}`);

        return grouped[x].map(({ discoveredMethod, meta: config }) => {
          return {
            key: config.actionName,
            handler: this.externalContextCreator.create(
              discoveredMethod.parentClass.instance,
              discoveredMethod.handler,
              discoveredMethod.methodName
            ),
          };
        });
      })
    );

    const handleAction = (
      evt: HasuraAction
    ) => {
      const key = isHasuraAction(evt)
        ? evt.action?.name
        : null;
      if (!key) throw new Error('Not a Hasura Action');

      // TODO: this should use a map for faster lookups
      const handlerAction = actionHandlers.find(x => x.key == key);

      if (this.hasuraModuleConfig.enableEventLogs) {
        this.logger.log(`Received action for: ${key}`);
      }

      if (handlerAction) {
        return handlerAction.handler(evt);
      } else {
        const errorMessage = `Handler not found for ${key}`;
        this.logger.error(errorMessage);
        throw new BadRequestException(errorMessage);
      }
    };

    return handleAction;

  }

}