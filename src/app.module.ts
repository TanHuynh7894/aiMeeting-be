import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadModule } from './modules/upload/upload.module';
import { SpeakersModule } from './models/speakers/speakers.module';
import { StorageObjectsModule } from './models/storage-objects/storage-objects.module';
import { VoiceSamplesModule } from './models/voice-samples/voice-samples.module';
import { AudioUploadsModule } from './models/audio-uploads/audio-uploads.module';
import { AudioSegmentsModule } from './models/audio-segments/audio-segments.module';
import { TranscriptsModule } from './models/transcripts/transcripts.module';
import { MeetingMinutesModule } from './models/meeting-minutes/meeting-minutes.module';
import { EmailLogsModule } from './models/email-logs/email-logs.module';
import { TaskDispatcherModule } from './modules/task-dispatcher/task-dispatcher.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres', 
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
    }),

    UploadModule,
    SpeakersModule,
    StorageObjectsModule,
    VoiceSamplesModule,
    AudioUploadsModule,
    AudioSegmentsModule,
    TranscriptsModule,
    MeetingMinutesModule,
    EmailLogsModule,
    TaskDispatcherModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}