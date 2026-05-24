import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationStatus, NotificationType } from '../../common/enums';
import { Order } from '../../orders/entities/order.entity';

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  order!: Order;

  @Column({ name: 'order_id', nullable: true })
  orderId!: string;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column()
  recipient!: string;

  @Column({ type: 'enum', enum: NotificationStatus })
  status!: NotificationStatus;

  @Column({ name: 'error_message', nullable: true })
  errorMessage!: string;

  @Column({ name: 'sent_at', type: 'timestamp' })
  sentAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
