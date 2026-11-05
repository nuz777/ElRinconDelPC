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

const isProduction = process.env.NODE_ENV === 'production';
const sslEnabled =
  process.env.DB_SSL === 'true' ||
  (isProduction && process.env.DB_SSL !== 'false');

function cleanDatabaseUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  let url = rawUrl.trim();
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }
  const postgresIndex = url.indexOf('postgres://');
  const postgresqlIndex = url.indexOf('postgresql://');
  const matchIndex =
    postgresIndex !== -1 &&
    (postgresqlIndex === -1 || postgresIndex < postgresqlIndex)
      ? postgresIndex
      : postgresqlIndex;
  if (matchIndex > 0) {
    url = url.slice(matchIndex).trim();
  }
  return url;
}

const cleanedDatabaseUrl = cleanDatabaseUrl(process.env.DATABASE_URL);

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  ...(cleanedDatabaseUrl
    ? {
        url: cleanedDatabaseUrl,
        ssl: sslEnabled ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'el_rincon_del_pc_db',
        ssl: sslEnabled ? { rejectUnauthorized: false } : false,
      }),
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
  logging: !isProduction,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
