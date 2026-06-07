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

@Module({
  imports: [
    // 1. Load biến môi trường từ .env
    ConfigModule.forRoot({
      isGlobal: true, 
    }),

    // 2. Kết nối Database tự động lấy thông số từ file .env
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
        entities: [__dirname + '/**/*.entity{.ts,.js}'], // Tự động dò tìm các file schema (bảng)
        synchronize: true, // Tự động tạo bảng/cột dựa theo code (rất tiện khi đang code Dev)
      }),
    }),

    // 3. Các module tính năng của project
    UploadModule,

    SpeakersModule,

    StorageObjectsModule,

    VoiceSamplesModule,

    AudioUploadsModule,

    AudioSegmentsModule,

    TranscriptsModule,

    MeetingMinutesModule,

    EmailLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}