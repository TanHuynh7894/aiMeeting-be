import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageObjectsService } from './storage-objects.service';
import { StorageObjectsController } from './storage-objects.controller';
import { StorageObject } from './entities/storage-object.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StorageObject])],
  controllers: [StorageObjectsController],
  providers: [StorageObjectsService],
  exports: [StorageObjectsService],
})
export class StorageObjectsModule {}