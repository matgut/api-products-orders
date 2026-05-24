import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Language } from '../../common/enums';
import { Product } from './product.entity';

@Entity('product_translations')
export class ProductTranslation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Product, (p) => p.translations, { onDelete: 'CASCADE' })
  product!: Product;

  @Column({ type: 'enum', enum: Language })
  language!: Language;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description!: string;
}
