import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('storage_objects')
export class StorageObject {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'bucket_name', type: 'varchar', nullable: true })
  bucketName!: string;

  @Column({ name: 'object_key', type: 'text', nullable: true })
  objectKey!: string;

  @Column({ name: 'original_file_name', type: 'varchar', nullable: true })
  originalFileName!: string;

  @Column({ name: 'file_type', type: 'varchar', nullable: true })
  fileType!: string;

  @Column({ name: 'mime_type', type: 'varchar', nullable: true })
  mimeType!: string;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize!: number;

  @Column({ name: 'uploaded_by', type: 'int', nullable: true })
  uploadedBy!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}