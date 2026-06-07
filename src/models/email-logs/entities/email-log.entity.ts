import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MeetingMinute } from '../../meeting-minutes/entities/meeting-minute.entity';

@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'meeting_minutes_id', type: 'int', nullable: true })
  meetingMinutesId!: number;

  @ManyToOne(() => MeetingMinute)
  @JoinColumn({ name: 'meeting_minutes_id' })
  meetingMinute!: MeetingMinute;

  @Column({ name: 'receiver_email', type: 'varchar', nullable: true })
  receiverEmail!: string;

  @Column({ name: 'send_status', type: 'varchar', nullable: true })
  sendStatus!: string;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt!: Date;
}