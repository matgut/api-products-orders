import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Language } from '../../common/enums';

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl!: string;

  @Column({
    name: 'default_language',
    type: 'enum',
    enum: Language,
    default: Language.ES,
  })
  defaultLanguage!: Language;

  @Column({ name: 'notification_email' })
  notificationEmail!: string;

  @Column({ name: 'notification_whatsapp', nullable: true })
  notificationWhatsapp!: string;

  @Column({ name: 'notify_via_email', default: true })
  notifyViaEmail!: boolean;

  @Column({ name: 'notify_via_whatsapp', default: false })
  notifyViaWhatsapp!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
