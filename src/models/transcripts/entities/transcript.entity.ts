import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AudioUpload } from '../../audio-uploads/entities/audio-upload.entity';
import { AudioSegment } from '../../audio-segments/entities/audio-segment.entity';

@Entity('transcripts')
export class Transcript {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'audio_upload_id', type: 'int', nullable: true })
  audioUploadId!: number;

  @ManyToOne(() => AudioUpload)
  @JoinColumn({ name: 'audio_upload_id' })
  audioUpload!: AudioUpload;

  @Column({ name: 'audio_segment_id', type: 'int', nullable: true })
  audioSegmentId!: number;

  @ManyToOne(() => AudioSegment)
  @JoinColumn({ name: 'audio_segment_id' })
  audioSegment!: AudioSegment;

  @Column({ name: 'transcript_text', type: 'text', nullable: true })
  transcriptText!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}