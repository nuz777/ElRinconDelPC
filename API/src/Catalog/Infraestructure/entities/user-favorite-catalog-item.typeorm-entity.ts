import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { UserTypeormEntity } from '../../../Auth/Infraestructure/entities/user.typeorm-entity.js';
import { CatalogItemTypeormEntity } from './catalog-item.typeorm-entity.js';

@Entity({ name: 'user_favorite_catalog_items' })
export class UserFavoriteCatalogItemTypeormEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @PrimaryColumn({ name: 'catalog_item_id', type: 'uuid' })
  catalogItemId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => UserTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserTypeormEntity;

  @ManyToOne(() => CatalogItemTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'catalog_item_id' })
  catalogItem?: CatalogItemTypeormEntity;
}
