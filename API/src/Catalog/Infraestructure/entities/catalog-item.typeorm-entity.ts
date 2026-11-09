import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { CatalogMinimumRequirements } from '../../Domain/Entities/catalog-item.entity.js';
import { CatalogSection } from '../../Domain/Entities/catalog-section.enum.js';

@Entity({ name: 'catalog_items' })
@Index('idx_catalog_items_section_genre', ['section', 'genre'])
export class CatalogItemTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20 })
  section!: CatalogSection;

  @Column({ type: 'varchar', length: 150 })
  title!: string;

  @Column({ type: 'varchar', length: 100 })
  genre!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  size!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, default: 'v1.0' })
  version!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  badge!: string | null;

  @Column({ name: 'cover_url', type: 'text', nullable: true })
  coverUrl!: string | null;

  @Column({ name: 'banner_url', type: 'text', nullable: true })
  bannerUrl!: string | null;

  @Column({ name: 'download_url', type: 'text', nullable: true })
  downloadUrl!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  developer!: string | null;

  @Column({ name: 'short_description', type: 'text' })
  shortDescription!: string;

  @Column({ name: 'minimum_requirements', type: 'jsonb', nullable: true })
  minimumRequirements!: CatalogMinimumRequirements | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
