import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'games' })
@Index('idx_games_slug', ['slug'], { unique: true })
@Index('idx_games_title', ['title'])
export class GameTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'varchar', length: 200 })
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'integer' })
  stock!: number;

  @Column({ type: 'text', array: true, default: '{}' })
  genres!: string[];

  @Column({ name: 'cover_image', type: 'text' })
  coverImage!: string;

  @Column({ name: 'banner_image', type: 'text', nullable: true })
  bannerImage!: string | null;

  @Column({ type: 'varchar', length: 150 })
  developer!: string;

  @Column({ type: 'varchar', length: 150 })
  publisher!: string;

  @Column({ name: 'release_date', type: 'timestamptz', nullable: true })
  releaseDate!: Date | null;

  @Column({ type: 'boolean', default: true })
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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
