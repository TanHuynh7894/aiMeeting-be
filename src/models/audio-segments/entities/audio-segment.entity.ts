import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AudioUpload } from '../../audio-uploads/entities/audio-upload.entity';
import { StorageObject } from '../../storage-objects/entities/storage-object.entity';

@Entity('audio_segments')
export class AudioSegment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'audio_upload_id', type: 'int', nullable: true })
  audioUploadId!: number;

  @ManyToOne(() => AudioUpload)
  @JoinColumn({ name: 'audio_upload_id' })
  audioUpload!: AudioUpload;

  @Column({ name: 'segment_storage_object_id', type: 'int', nullable: true })
  segmentStorageObjectId!: number;

  @ManyToOne(() => StorageObject)
  @JoinColumn({ name: 'segment_storage_object_id' })
  segmentStorageObject!: StorageObject;

  @Column({ name: 'start_time', type: 'decimal', nullable: true })
  startTime!: number;

  @Column({ name: 'end_time', type: 'decimal', nullable: true })
  endTime!: number;

  @Column({ name: 'confidence_score', type: 'decimal', nullable: true })
  confidenceScore!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'person', type: 'varchar', nullable: true })
  person!: string;
}