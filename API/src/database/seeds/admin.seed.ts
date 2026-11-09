import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import type { Role } from '../../Auth/Domain/Entities/roles.enum.js';
import { dataSourceOptions } from '../data-source.js';

config();
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), 'API/.env') });

interface AdminSeedData {
  firstName: string;
  lastName: string | null;
  email: string;
  plainPassword: string;
  provider: string;
  role: `${Role}`;
}

const SALT_ROUNDS = 10;

const INITIAL_ADMINS: AdminSeedData[] = [
  {
    firstName: 'Dozen_Apollo',
    lastName: null,
    email: 'theunrealultranigg@gmail.com',
    plainPassword: 'M1043449928m*',
    provider: 'system',
    role: 'admin',
  },
  {
    firstName: 'Ivan',
    lastName: 'Mejia',
    email: 'ivanlun647@gmail.com',
    plainPassword: 'ivandev23#009',
    provider: 'system',
    role: 'admin',
  },
  {
    firstName: 'nicholas-delarosa',
    lastName: null,
    email: 'nicholasandresdelarosarivera@hotmail.com',
    plainPassword: 'MY_DELTARUNE',
    provider: 'system',
    role: 'admin',
  },
];

export async function seedAdmins(existingDataSource?: DataSource): Promise<void> {
  const ds = existingDataSource ?? new DataSource(dataSourceOptions);

  const shouldDestroy = !ds.isInitialized;

  if (!ds.isInitialized) {
    await ds.initialize();
  }

  try {
    for (const admin of INITIAL_ADMINS) {
      const normalizedEmail = admin.email.toLowerCase();
      const passwordHash = await bcrypt.hash(admin.plainPassword, SALT_ROUNDS);

      // Si el correo ya existía registrado como usuario corriente, se elimina primero
      await ds.query(
        `DELETE FROM users WHERE LOWER(email) = $1 AND (role != 'admin' OR provider != 'system');`,
        [normalizedEmail],
      );

      await ds.query(
        `
        INSERT INTO users (email, password_hash, provider, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          provider = EXCLUDED.provider,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role;
        `,
        [
          normalizedEmail,
          passwordHash,
          admin.provider,
          admin.firstName,
          admin.lastName,
          admin.role,
        ],
      );
    }
    console.log('Semilla de administradores ejecutada correctamente.');
  } finally {
    if (shouldDestroy && ds.isInitialized) {
      await ds.destroy();
    }
  }
}

const isDirectExecution =
  process.argv[1]?.endsWith('admin.seed.ts') ||
  process.argv[1]?.endsWith('admin.seed.js');

if (isDirectExecution) {
  seedAdmins().catch((error: unknown) => {
    console.error('Error al ejecutar la semilla de administradores:', error);
    process.exit(1);
  });
}
