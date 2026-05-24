import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Language } from '../../common/enums';
import { Category } from './category.entity';

@Entity('category_translations')
export class CategoryTranslation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Category, (c) => c.translations, { onDelete: 'CASCADE' })
  category!: Category;

  @Column({ type: 'enum', enum: Language })
  language!: Language;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description!: string;
}
