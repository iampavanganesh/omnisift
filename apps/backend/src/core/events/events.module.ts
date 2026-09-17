import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Global()
@Module({ imports: [EventEmitterModule.forRoot({ global: true })] })
export class EventsModule {}
