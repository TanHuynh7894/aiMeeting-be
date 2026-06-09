import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Speaker } from '../../speakers/entities/speaker.entity';
import { StorageObject } from '../../storage-objects/entities/storage-object.entity';

@Entity('voice_samples')
export class VoiceSample {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'speaker_id', type: 'int', nullable: true })
  speakerId!: number;

  @ManyToOne(() => Speaker)
  @JoinColumn({ name: 'speaker_id' })
  speaker!: Speaker;

  @Column({ name: 'storage_object_id', type: 'int', nullable: true })
  storageObjectId!: number;

  @ManyToOne(() => StorageObject)
  @JoinColumn({ name: 'storage_object_id' })
  storageObject!: StorageObject;

  @Column({ name: 'duration_seconds', type: 'int', nullable: true })
  durationSeconds!: number;

  @Column({ name: 'sample_status', type: 'varchar', nullable: true })
  sampleStatus!: string;

  @Column({ 
    type: 'vector', 
    dimension: 512,
    nullable: true 
  } as any)
  embedding!: number[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}