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
import { Category } from '../../categories/entities/category.entity';
import { ProductTranslation } from '../entities/product-translation.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ name: 'image_url', nullable: true })
  imageUrl!: string;

  @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true })
  category!: Category;

  @Column({ name: 'category_id', nullable: true })
  categoryId!: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  business!: Business;

  @Column({ name: 'business_id' })
  businessId!: string;

  @Column({ default: true })
  available!: boolean;

  @Column({ nullable: true, type: 'int' })
  stock!: number;

  @OneToMany(() => ProductTranslation, (t) => t.product, {
    cascade: true,
    eager: true,
  })
  translations!: ProductTranslation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
