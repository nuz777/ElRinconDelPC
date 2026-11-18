import { DataSource, type DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

// Carga única del .env: el de la carpeta actual o, si se ejecuta desde la raíz del repo, API/.env
const envPath = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'API/.env'),
].find((path) => existsSync(path));
if (envPath) {
  config({ path: envPath, quiet: true });
}

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
  migrationsRun: process.env.DB_RUN_MIGRATIONS !== 'false',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  extra: {
    max: parseInt(process.env.DB_POOL_MAX ?? '15', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
