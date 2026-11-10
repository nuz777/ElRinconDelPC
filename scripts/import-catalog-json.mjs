#!/usr/bin/env node

/**
 * Script de Carga Masiva de Catálogo para El Sótano del PC
 *
 * Lee archivos JSON con uno o múltiples elementos (juegos, mods, herramientas, roms),
 * extrae título, peso, etiqueta, descripción general y especificaciones de PC,
 * e importa los registros en la base de datos a través de la API.
 *
 * Reglas de portadas y enlaces:
 * - NO lee portadas del JSON (se asigna carátula estándar provisional para que el usuario las suba manualmente).
 * - NO lee links de descarga (se asigna enlace provisional para editarlo después).
 *
 * Uso:
 *   node scripts/import-catalog-json.mjs <ruta-al-archivo.json> [--api http://localhost:3000] [--token TU_JWT_TOKEN]
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
========================================================================
   SCRIPT DE CARGA MASIVA - EL SÓTANO DEL PC (CATÁLOGO JSON)
========================================================================

Uso:
  node scripts/import-catalog-json.mjs <archivo.json> [opciones]

Opciones:
  --api <url>      URL base de la API (por defecto: http://localhost:3000)
  --token <jwt>    Token JWT de administrador (si tu API requiere Auth)

Ejemplo de archivo JSON válido:
[
  {
    "titulo": "God of War Ragnarok",
    "apartado": "juegos",
    "genero": "Acción / Aventura",
    "peso": "84.2 GB",
    "version": "v1.0.3",
    "desarrollador": "Santa Monica Studio",
    "etiqueta": "Popular",
    "descripcion": "Viaje de Kratos y Atreus a través de los Nueve Reinos.",
    "especificaciones": {
      "so": "Windows 10 64-bit",
      "cpu": "Intel Core i5-6600k / AMD Ryzen 5 2400 G",
      "ram": "16 GB RAM",
      "gpu": "NVIDIA GTX 1060 (6 GB) / AMD RX 570 (4 GB)",
      "almacenamiento": "90 GB libres"
    }
  }
]
========================================================================
`);
  process.exit(0);
}

const filePath = args.find((a) => !a.startsWith('--'));
const apiIndex = args.indexOf('--api');
const tokenIndex = args.indexOf('--token');

const API_URL = (apiIndex !== -1 && args[apiIndex + 1]) || process.env.API_URL || 'http://localhost:3000';
const JWT_TOKEN = (tokenIndex !== -1 && args[tokenIndex + 1]) || process.env.ADMIN_TOKEN || '';

if (!filePath) {
  console.error('❌ Error: Debes especificar la ruta a un archivo .json');
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), filePath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`❌ Error: El archivo no existe: ${resolvedPath}`);
  process.exit(1);
}

let rawContent;
try {
  rawContent = fs.readFileSync(resolvedPath, 'utf8');
} catch (err) {
  console.error(`❌ Error leyendo el archivo: ${err.message}`);
  process.exit(1);
}

let parsedJson;
try {
  parsedJson = JSON.parse(rawContent);
} catch (err) {
  console.error(`❌ Error de sintaxis en el archivo JSON: ${err.message}`);
  process.exit(1);
}

// Normalización de lista
let itemsList = [];
if (Array.isArray(parsedJson)) {
  itemsList = parsedJson;
} else if (parsedJson && typeof parsedJson === 'object') {
  if (Array.isArray(parsedJson.items)) itemsList = parsedJson.items;
  else if (Array.isArray(parsedJson.juegos)) itemsList = parsedJson.juegos;
  else if (Array.isArray(parsedJson.games)) itemsList = parsedJson.games;
  else itemsList = [parsedJson];
}

function getVal(obj, keys, fallback = '') {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
      return String(obj[k]).trim();
    }
  }
  return fallback;
}

function normalizeSection(raw) {
  const str = String(raw || 'juegos').trim().toLowerCase();
  if (str.startsWith('mod')) return 'MODS';
  if (str.startsWith('herramienta') || str.startsWith('tool')) return 'HERRAMIENTAS';
  if (str.startsWith('rom')) return 'ROMS';
  return 'JUEGOS';
}

console.log(`\n📦 Analizando ${itemsList.length} elemento(s) desde "${filePath}"...`);

const validPayloads = [];
for (let i = 0; i < itemsList.length; i++) {
  const raw = itemsList[i];
  const title = getVal(raw, ['titulo', 'title', 'nombre', 'name']);
  if (!title) {
    console.warn(`⚠️  Item #${i + 1} omitido: No tiene "titulo" o "title".`);
    continue;
  }

  const section = normalizeSection(getVal(raw, ['apartado', 'seccion', 'section', 'tipo']));
  const defaultGenre = section === 'MODS' ? 'Gráficos & Shaders' : section === 'HERRAMIENTAS' ? 'Optimización del Sistema' : section === 'ROMS' ? 'Acción' : 'Acción / Shooter';
  const genre = getVal(raw, ['genero', 'género', 'genre', 'categoria'], defaultGenre);
  const size = getVal(raw, ['peso', 'tamano', 'tamaño', 'size'], '1.0 GB');
  const version = getVal(raw, ['version', 'versión', 'ver'], 'v1.0');
  const developer = getVal(raw, ['desarrollador', 'developer', 'dev', 'estudio'], 'Comunidad El Sótano');
  const badge = getVal(raw, ['etiqueta', 'tag', 'badge'], 'Nuevo');
  const shortDescription = getVal(raw, ['descripcion', 'descripción', 'shortDesc', 'shortDescription', 'description'], `${title} en El Sótano.`);

  // Especificaciones
  const specs = raw.especificaciones || raw.especificaciones_pc || raw.requisitos || raw.requirements || raw.minimumRequirements || raw;
  const os = getVal(specs, ['so', 'os', 'sistema_operativo'], 'Windows 10 / 11 64-bit');
  const cpu = getVal(specs, ['cpu', 'procesador'], 'Intel Core i5 / AMD Ryzen 5');
  const ram = getVal(specs, ['ram', 'memoria_ram', 'memoria'], '8 GB RAM');
  const storage = getVal(specs, ['almacenamiento', 'storage', 'disco'], size ? `${size} libres` : '50 GB libres');
  const gpu = getVal(specs, ['gpu', 'tarjeta_grafica', 'grafica'], 'NVIDIA GTX 1060 / AMD RX 580');

  // Portadas y links se dejan intactos / predeterminados por regla del usuario
  const payload = {
    section,
    title,
    genre,
    size,
    version,
    badge,
    developer,
    shortDescription,
    coverUrl: '/img/indicado.webp',
    minimumRequirements: { os, cpu, ram, storage, gpu },
    ...(section === 'ROMS'
      ? {
          brand: getVal(raw, ['marca', 'brand'], 'Nintendo'),
          console: getVal(raw, ['consola', 'console'], 'Super Nintendo'),
          emulator: getVal(raw, ['emulador', 'emulator'], undefined),
        }
      : {}),
  };

  validPayloads.push(payload);
}

console.log(`✅ ${validPayloads.length} de ${itemsList.length} elementos estructurados correctamente.`);

async function runImport() {
  console.log(`\n🚀 Enviando a la API en ${API_URL}/catalog...`);

  const headers = { 'Content-Type': 'application/json' };
  if (JWT_TOKEN) {
    headers['Authorization'] = `Bearer ${JWT_TOKEN}`;
  }

  let successCount = 0;
  for (let i = 0; i < validPayloads.length; i++) {
    const p = validPayloads[i];
    try {
      const res = await fetch(`${API_URL}/catalog`, {
        method: 'POST',
        headers,
        body: JSON.stringify(p),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        console.error(`❌ Falló "${p.title}" (Status ${res.status}): ${errorBody}`);
      } else {
        const created = await res.json();
        console.log(`   [${i + 1}/${validPayloads.length}] ✅ Creado: ${p.title} (${p.section}) - ID: ${created.id}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error de conexión al importar "${p.title}": ${err.message}`);
    }
  }

  console.log(`\n🎉 Resumen: Se importaron exitosamente ${successCount} de ${validPayloads.length} elementos.`);
  console.log(`💡 Recuerda: Puedes subir las portadas personalizadas y enlaces entrando a cada juego en la web y pulsando "Editar".\n`);
}

runImport();
