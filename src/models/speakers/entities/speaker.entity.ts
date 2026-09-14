import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AudioUploadSpeaker } from '../../audio-upload-speakers/entities/audio-upload-speaker.entity';
import { VoiceSample } from '../../voice-samples/entities/voice-sample.entity';

@Entity('speakers')
export class Speaker {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'full_name', type: 'varchar', nullable: true })
  fullName!: string;

  @Column({ type: 'varchar', nullable: true })
  email!: string;

  @Column({ name: 'speaker_type', type: 'varchar', nullable: true })
  speakerType!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => AudioUploadSpeaker, (aus) => aus.speaker)
  audioUploadSpeakers!: AudioUploadSpeaker[];

  @OneToMany(() => VoiceSample, (vs) => vs.speaker)
  voiceSamples!: VoiceSample[];
}