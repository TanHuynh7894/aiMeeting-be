import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AudioUpload } from '../../audio-uploads/entities/audio-upload.entity';
import { StorageObject } from '../../storage-objects/entities/storage-object.entity';

@Entity('meeting_minutes')
export class MeetingMinute {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'audio_upload_id', type: 'int', nullable: true })
  audioUploadId!: number;

  @ManyToOne(() => AudioUpload)
  @JoinColumn({ name: 'audio_upload_id' })
  audioUpload!: AudioUpload;

  @Column({ name: 'pdf_storage_object_id', type: 'int', nullable: true })
  pdfStorageObjectId!: number;

  @ManyToOne(() => StorageObject)
  @JoinColumn({ name: 'pdf_storage_object_id' })
  pdfStorageObject!: StorageObject;

  @Column({ name: 'docx_storage_object_id', type: 'int', nullable: true })
  docxStorageObjectId!: number;

  @ManyToOne(() => StorageObject)
  @JoinColumn({ name: 'docx_storage_object_id' })
  docxStorageObject!: StorageObject;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt!: Date;
}