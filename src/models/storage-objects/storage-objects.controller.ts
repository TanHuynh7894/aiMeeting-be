import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StorageObjectsService } from './storage-objects.service';
import { CreateStorageObjectDto } from './dto/create-storage-object.dto';
import { UpdateStorageObjectDto } from './dto/update-storage-object.dto';

@ApiTags('Storage Objects')
@Controller('storage-objects')
export class StorageObjectsController {
  constructor(private readonly storageObjectsService: StorageObjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới Storage Object' })
  create(@Body() createStorageObjectDto: CreateStorageObjectDto) {
    return this.storageObjectsService.create(createStorageObjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách Storage Objects' })
  findAll() {
    return this.storageObjectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết Storage Object' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.storageObjectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật Storage Object' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateStorageObjectDto: UpdateStorageObjectDto) {
    return this.storageObjectsService.update(id, updateStorageObjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa Storage Object' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.storageObjectsService.remove(id);
  }
}