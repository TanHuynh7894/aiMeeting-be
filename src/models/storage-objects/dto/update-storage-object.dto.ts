import { PartialType } from '@nestjs/swagger';
import { CreateStorageObjectDto } from './create-storage-object.dto';

export class UpdateStorageObjectDto extends PartialType(CreateStorageObjectDto) {}
