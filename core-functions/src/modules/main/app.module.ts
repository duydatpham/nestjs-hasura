import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '../config';
import { CommonModule } from '../common';
import { AuthModule } from 'modules/auth';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        console.log('cache', configService.get('REDIS_URL'))
        let cacheConfig = {}
        if (!!configService.get('REDIS_URL')) {
          cacheConfig = {
            cache: {
              type: "redis",
              options: {
                url: configService.get('REDIS_URL')
              }
            }
          }
        }

        return {
          type: configService.get('DB_TYPE'),
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          entities: [__dirname + './../**/**.entity{.ts,.js}'],
          synchronize: configService.get('DB_SYNC') === 'true',
          timezone: 'GMT+7',
          ...cacheConfig,
        } as TypeOrmModuleAsyncOptions;
      },
    }),
    EventEmitterModule.forRoot(),
    ConfigModule,
    AuthModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
