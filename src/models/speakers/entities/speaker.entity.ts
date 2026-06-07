import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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
}