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
