import { Exclude } from 'class-transformer';
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { Language, Role } from '../../common/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Exclude()
  @Column()
  password!: string;

  @Column({ type: 'enum', enum: Role, default: Role.ADMIN })
  role!: Role;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'business_id', nullable: true, type: 'uuid' })
  businessId!: string | null;

  @Column({
    name: 'preferred_language',
    type: 'enum',
    enum: Language,
    default: Language.ES,
  })
  preferredLanguage!: Language;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];
}
