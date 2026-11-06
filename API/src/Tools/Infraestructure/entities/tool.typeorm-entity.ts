import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserTypeormEntity } from '../../../Auth/Infraestructure/entities/user.typeorm-entity.js';

@Entity({ name: 'tools' })
@Index('idx_tools_slug', ['slug'], { unique: true })
@Index('idx_tools_category', ['category'])
@Index('idx_tools_author_id', ['authorId'])
@Index('idx_tools_is_active', ['isActive'])
export class ToolTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  title!: string;

  @Column({ type: 'varchar', length: 150 })
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 100, default: 'Utilidades' })
  category!: string;

  @Column({ type: 'varchar', length: 50, default: 'v1.0' })
  version!: string;

  @Column({ name: 'size', type: 'varchar', length: 50, nullable: true })
  size!: string | null;

  @Column({ name: 'download_url', type: 'text' })
  downloadUrl!: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  tags!: string[];

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ name: 'downloads_count', type: 'integer', default: 0 })
  downloadsCount!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToOne(() => UserTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: UserTypeormEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
