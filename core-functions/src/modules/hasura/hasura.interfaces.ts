const exampleEvent = {
    id: 'ecd5fe4a-7113-4243-bb0e-6177c78a0033',
    table: { schema: 'public', name: 'user' },
    trigger: { name: 'user_created' },
    event: {
      session_variables: { 'x-hasura-role': 'admin' },
      op: 'INSERT',
      data: { old: null, new: [Object] },
    },
    delivery_info: { current_retry: 0, max_retries: 0 },
    created_at: '2020-02-20T01:12:12.789983Z',
  };

  const exampleAction = {
    session_variables: {
      "x-hasura-role": "admin"
    },
    input: {
      arg1: {
        username: "Huy"
      }
    },
    action: {
      name: "actionName"
    }
  }
  
  export type EventOperation = 'INSERT' | 'UPDATE' | 'DELETE' | 'MANUAL';
  
  type EventPayload = {
    session_variables: Record<string, string>;
    op: EventOperation;
    data: { old: unknown; new: unknown };
  };
  
  export type TypedEventPayload<T> = Omit<EventPayload, 'data'> & {
    data: { old?: T; new: T };
  };
  
  export type InsertEventPayload<T> = Omit<EventPayload, 'data'> & {
    data: { old: null; new: T };
  };
  
  export type UpdateEventPayload<T> = Omit<EventPayload, 'data'> & {
    data: { old: T; new: T };
  };
  
  export type DeleteEventPayload<T> = Omit<EventPayload, 'data'> & {
    data: { old: T; new: null };
  };
  
  export type HasuraEvent = Omit<typeof exampleEvent, 'event'> & {
    event: EventPayload;
  };
  
  export type TypedHasuraEvent<T> = Omit<HasuraEvent, 'event'> & {
    event: TypedEventPayload<T>;
  };
  
  export type HasuraInsertEvent<T> = Omit<HasuraEvent, 'event'> & {
    event: InsertEventPayload<T>;
  };
  
  export type HasuraUpdateEvent<T> = Omit<HasuraEvent, 'event'> & {
    event: UpdateEventPayload<T>;
  };
  
  export type HasuraDeleteEvent<T> = Omit<HasuraEvent, 'event'> & {
    event: DeleteEventPayload<T>;
  };
  
  export interface HasuraEventHandlerConfig {
    /**
     * The name of the Hasura Trigger which created this event
     */
    triggerName: string;
  }
  
  export interface HasuraActionHandlerConfig {
    /**
     * The name of the Hasura Action
     */
    actionName: string;
  }

  type InsertDefinition = { type: 'insert' };
  type DeleteDefinition = { type: 'delete' };
  type UpdateDefinition = { type: 'update'; columns?: string[] };
  
  export interface EventRetryConfig {
    numRetries: number;
    timeoutInSeconds: number;
    intervalInSeconds: number;
  }
  
  export interface ScheduledEventRetryConfig extends EventRetryConfig {
    toleranceSeconds: number;
  }
  
  export interface TrackedHasuraEventHandlerConfig {
    schema?: string;
    tableName: string;
    triggerName: string;
    retryConfig?: EventRetryConfig;
    definition: InsertDefinition | DeleteDefinition | UpdateDefinition;
  }
  
  export interface TrackedHasuraScheduledEventHandlerConfig {
    name: string;
    cronSchedule: string;
    payload: any;
    comment?: string;
    retryConfig?: ScheduledEventRetryConfig;
  }
  
  export enum CommonCronSchedules {
    EveryMinute = '* * * * *',
    EveryTenMinutes = '*/10 * * * *',
    EveryMidnight = '0 0 * * *',
    EveryMonthStart = '0 0 1 * *',
    EveryFridayNoon = '0 12 * * 5',
  }
  
  export interface HasuraScheduledEventPayload<T = Record<string, any>> {
    scheduled_time: Date;
    payload: T;
    name: string;
    created_at: Date;
    id: string;
  }
  
  export interface HasuraModuleConfig {
    enableEventLogs?: boolean;
  
    /**
     * The default controller prefix that will be used for exposing a Webhook that can be used by Hasura
     * to send events. Defaults to 'hasura'
     */
    controllerPrefix?: string;
  
    /**
     * An optional array of class decorators to apply to the `EventHandlerController`. These decorators can
     * only apply metadata that will be read at request time, and not read at start time (i.e. you cannot use
     * `@UseGuards()`, `@UseInterceptor()` or any other NestJS enhancer decorators)
     */
    decorators?: ClassDecorator[];
  }
  
  export type HasuraAction<T = Record<string, string>> = {
    action: {
      name: string;
    };
    session_variables: Record<string, string>;
    input: T;
  };

  export type HasuraHookAuthen<T = Record<string, string>> = {
    headers: T;
    request: T;
  };