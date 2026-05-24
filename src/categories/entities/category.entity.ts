import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity';
import { CategoryTranslation } from '../entities/category-translation.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE', eager: false })
  business!: Business;

  @Column({ name: 'business_id', nullable: true })
  businessId!: string;

  @OneToMany(() => CategoryTranslation, (t) => t.category, {
    cascade: true,
    eager: true,
  })
  translations!: CategoryTranslation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
