import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserTypeormEntity } from '../../../Auth/Infraestructure/entities/user.typeorm-entity.js';
import { AiProvider } from '../../Domain/ai-provider.enum.js';

@Entity({ name: 'admin_ai_configs' })
export class AdminAiConfigTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => UserTypeormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserTypeormEntity;

  @Column({
    type: 'varchar',
    length: 20,
    default: AiProvider.GEMINI,
  })
  provider!: AiProvider;

  @Column({ name: 'encrypted_api_key', type: 'text', nullable: true })
  encryptedApiKey!: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
