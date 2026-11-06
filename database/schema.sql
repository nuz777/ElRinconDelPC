-- =============================================================================
-- Base de Datos Inicial - El Rincón del PC
-- Archivo: schema.sql
-- =============================================================================

-- Activación de extensiones para generación de identificadores únicos UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'local',
    provider_id VARCHAR(255) NULL,
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    picture TEXT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    reset_token VARCHAR(6) NULL,
    reset_token_expires TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización de consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);

-- Función y trigger para actualizar updated_at de manera automática
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Semilla inicial de Administradores (contraseñas hasheadas con bcrypt - 10 rondas)
INSERT INTO users (email, password_hash, provider, first_name, last_name, role)
VALUES
    (
        'theunrealultranigg@gmail.com',
        '$2b$10$VjkiiKmEqhVFFrfl/6vJIeIDx/apXfieZraPTlbH.wdTxsdCp1.uO',
        'system',
        'Dozen_Apollo',
        NULL,
        'admin'
    ),
    (
        'ivanlun647@gmail.com',
        '$2b$10$qDNDuiQ8.Vf4smtlM2D.zeIzC3lEH4zAXUAwZyW3BflCqY5lr7x3C',
        'system',
        'Ivan',
        'Mejia',
        'admin'
    )
ON CONFLICT (email) DO NOTHING;

-- Tabla: catalog_items (juegos, mods y herramientas publicados por administradores)
CREATE TABLE IF NOT EXISTS catalog_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section VARCHAR(20) NOT NULL CHECK (section IN ('JUEGOS', 'MODS', 'HERRAMIENTAS')),
    title VARCHAR(150) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    size VARCHAR(50) NULL,
    version VARCHAR(50) NULL DEFAULT 'v1.0',
    badge VARCHAR(50) NULL,
    cover_url TEXT NULL,
    download_url TEXT NULL,
    developer VARCHAR(150) NULL,
    short_description TEXT NOT NULL,
    minimum_requirements JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_section_genre ON catalog_items(section, genre);
CREATE INDEX IF NOT EXISTS idx_catalog_items_created_at ON catalog_items(created_at DESC);

DROP TRIGGER IF EXISTS trg_catalog_items_updated_at ON catalog_items;
CREATE TRIGGER trg_catalog_items_updated_at
    BEFORE UPDATE ON catalog_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tabla: games (módulo de juegos)
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_price NUMERIC(10, 2) NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    genres TEXT[] NOT NULL DEFAULT '{}',
    cover_image TEXT NOT NULL,
    banner_image TEXT NULL,
    developer VARCHAR(150) NOT NULL,
    publisher VARCHAR(150) NOT NULL,
    release_date TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    min_os VARCHAR(100) NULL,
    min_storage VARCHAR(100) NULL,
    min_ram VARCHAR(100) NULL,
    min_cpu VARCHAR(100) NULL,
    min_gpu VARCHAR(100) NULL,
    minimum_requirements JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_games_slug ON games (slug);
CREATE INDEX IF NOT EXISTS idx_games_title ON games (title);
CREATE INDEX IF NOT EXISTS idx_games_is_active ON games (is_active);

DROP TRIGGER IF EXISTS trg_games_updated_at ON games;
CREATE TRIGGER trg_games_updated_at
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tabla: mods (módulo de mods asociados a juegos y usuarios)
CREATE TABLE IF NOT EXISTS mods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    version VARCHAR(50) NOT NULL,
    download_url TEXT NOT NULL,
    file_size VARCHAR(50) NULL,
    thumbnail_url TEXT NULL,
    game_id UUID NOT NULL,
    author_id UUID NOT NULL,
    downloads_count INTEGER NOT NULL DEFAULT 0,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mods_game FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE,
    CONSTRAINT fk_mods_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mods_game_slug ON mods (game_id, slug);
CREATE INDEX IF NOT EXISTS idx_mods_game_id ON mods (game_id);
CREATE INDEX IF NOT EXISTS idx_mods_author_id ON mods (author_id);
CREATE INDEX IF NOT EXISTS idx_mods_is_approved ON mods (is_approved);
CREATE INDEX IF NOT EXISTS idx_mods_is_active ON mods (is_active);

DROP TRIGGER IF EXISTS trg_mods_updated_at ON mods;
CREATE TRIGGER trg_mods_updated_at
    BEFORE UPDATE ON mods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

