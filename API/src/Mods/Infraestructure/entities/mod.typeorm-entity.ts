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
import { GameTypeormEntity } from '../../../Games/Infraestructure/entities/game.typeorm-entity.js';
import { UserTypeormEntity } from '../../../Auth/Infraestructure/entities/user.typeorm-entity.js';

@Entity({ name: 'mods' })
@Index('idx_mods_game_slug', ['gameId', 'slug'], { unique: true })
@Index('idx_mods_game_id', ['gameId'])
@Index('idx_mods_author_id', ['authorId'])
export class ModTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'varchar', length: 200 })
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 50 })
  version!: string;

  @Column({ name: 'download_url', type: 'text' })
  downloadUrl!: string;

  @Column({ name: 'file_size', type: 'varchar', length: 50, nullable: true })
  fileSize!: string | null;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl!: string | null;

  @Column({ name: 'game_id', type: 'uuid', nullable: true })
  gameId!: string | null;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ name: 'downloads_count', type: 'integer', default: 0 })
  downloadsCount!: number;

  @Column({ name: 'is_approved', type: 'boolean', default: false })
  isApproved!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  // Requisitos mínimos
  @Column({ name: 'min_os', type: 'varchar', length: 100, nullable: true })
  minOs!: string | null;

  @Column({ name: 'min_storage', type: 'varchar', length: 100, nullable: true })
  minStorage!: string | null;

  @Column({ name: 'min_ram', type: 'varchar', length: 100, nullable: true })
  minRam!: string | null;

  @Column({ name: 'min_cpu', type: 'varchar', length: 100, nullable: true })
  minCpu!: string | null;

  @Column({ name: 'min_gpu', type: 'varchar', length: 100, nullable: true })
  minGpu!: string | null;

  @ManyToOne(() => GameTypeormEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'game_id' })
  game!: GameTypeormEntity | null;

  @ManyToOne(() => UserTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: UserTypeormEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
