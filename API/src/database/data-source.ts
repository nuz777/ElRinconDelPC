import { DataSource, type DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

config();
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), 'API/.env') });

const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);
const isCompiledJs =
  currentFile.endsWith('.js') || process.env.NODE_ENV === 'production';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'el_rincon_del_pc_db',
  entities: [
    isCompiledJs
      ? join(currentDir, '..', '**', '*{.entity,.typeorm-entity}.js')
      : 'src/**/*{.entity,.typeorm-entity}.ts',
  ],
  migrations: [
    isCompiledJs
      ? join(currentDir, 'migrations', '*.js')
      : 'src/database/migrations/*.ts',
  ],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
