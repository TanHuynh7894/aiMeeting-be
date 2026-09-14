import { Entity, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AudioUpload } from '../../audio-uploads/entities/audio-upload.entity';
import { Speaker } from '../../speakers/entities/speaker.entity';

@Entity('audio_upload_speakers')
export class AudioUploadSpeaker {
  @PrimaryColumn({ name: 'audio_upload_id', type: 'int' })
  audioUploadId!: number;

  @PrimaryColumn({ name: 'speaker_id', type: 'int' })
  speakerId!: number;

  @ManyToOne(() => AudioUpload, (audioUpload) => audioUpload.audioUploadSpeakers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'audio_upload_id' })
  audioUpload!: AudioUpload;

  @ManyToOne(() => Speaker, (speaker) => speaker.audioUploadSpeakers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'speaker_id' })
  speaker!: Speaker;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
