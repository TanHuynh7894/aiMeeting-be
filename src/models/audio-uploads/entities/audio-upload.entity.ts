import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { StorageObject } from '../../storage-objects/entities/storage-object.entity';
import { AudioUploadSpeaker } from '../../audio-upload-speakers/entities/audio-upload-speaker.entity';

@Entity('audio_uploads')
export class AudioUpload {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'storage_object_id', type: 'int', nullable: true })
  storageObjectId!: number;

  @ManyToOne(() => StorageObject)
  @JoinColumn({ name: 'storage_object_id' })
  storageObject!: StorageObject;

  @Column({ name: 'duration_seconds', type: 'int', nullable: true })
  durationSeconds!: number;

  @Column({ name: 'processing_status', type: 'varchar', nullable: true })
  processingStatus!: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt!: Date;

  @OneToMany(() => AudioUploadSpeaker, (aus) => aus.audioUpload)
  audioUploadSpeakers!: AudioUploadSpeaker[];
}