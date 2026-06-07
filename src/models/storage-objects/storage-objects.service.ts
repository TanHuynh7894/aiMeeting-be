import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageObject } from './entities/storage-object.entity';
import { CreateStorageObjectDto } from './dto/create-storage-object.dto';
import { UpdateStorageObjectDto } from './dto/update-storage-object.dto';

@Injectable()
export class StorageObjectsService {
  constructor(
    @InjectRepository(StorageObject)
    private readonly storageRepo: Repository<StorageObject>,
  ) {}

  async create(createDto: CreateStorageObjectDto) {
    const newRecord = this.storageRepo.create(createDto);
    return await this.storageRepo.save(newRecord);
  }

  async findAll() {
    return await this.storageRepo.find();
  }

  async findOne(id: number) {
    const record = await this.storageRepo.findOneBy({ id });
    if (!record) throw new NotFoundException(`Không tìm thấy dữ liệu ID = ${id}`);
    return record;
  }

  async update(id: number, updateDto: UpdateStorageObjectDto) {
    const record = await this.findOne(id);
    Object.assign(record, updateDto);
    return await this.storageRepo.save(record);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    await this.storageRepo.remove(record);
    return { message: `Đã xóa thành công ID = ${id}` };
  }
}