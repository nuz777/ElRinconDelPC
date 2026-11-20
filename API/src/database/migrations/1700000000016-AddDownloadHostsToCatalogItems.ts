import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Guarda en qué sitio está alojada cada parte del archivo de descarga y asigna el
 * medio a los ítems ya subidos.
 *
 * La asignación sale de leer el destino real de cada enlace en el panel de exe.io
 * (y, si el destino era un .txt con varios enlaces, contando sus partes). Solo se
 * actualizan los ítems cuyo `download_url` es exactamente el mismo enlace de exe.io
 * y que todavía no tienen medio asignado.
 *
 * Quedaron fuera a propósito:
 * - exe.io/AI7HcU y exe.io/zl9VAQ (Hollow Knight y Silksong): el paste pide
 *   verificación humana y no se pudo ver a dónde llevan.
 * - En los .txt con enlaces intercambiables (varios sitios por parte) se toma el
 *   primer sitio de la lista.
 */
const part = (host: string, count = 1): string[] => Array.from({ length: count }, () => host);

const EXE_IO_HOSTS: Record<string, string[]> = {
  MYFEMBOYROOMMATE: part('mediafire'),
  JRbEzavd: part('gdrive'),
  TrzSayp: part('mediafire', 5),
  o8iQLIaN: part('mediafire', 15),
  cquVb: part('mediafire', 13),
  h7SYS: part('gofile'),
  LustTap: part('buzzheavier'),
  LustfulSisters: part('mediafire'),
  MonmusuBuster: part('buzzheavier'),
  fdvQ6Q0: part('gofile'),
  Kabopuri2: part('buzzheavier'),
  VOcEQJR: part('mediafire'),
  NakedIsland: part('mediafire'),
  LlxyAs: part('mediafire'),
  FemdomGameWorldStacy: part('buzzheavier'),
  AcademyMystery: part('pixeldrain'),
  XT4GC: part('mediafire'),
  '3AlJzF': part('gdrive'),
  Daiteikoku: part('buzzheavier'),
  FallenFlower: part('buzzheavier'),
  BedFirstLoveLater: part('buzzheavier'),
  GirlCourageTest6: part('mediafire'),
  BangHinata: part('pixeldrain'),
  LetsGoBustyParadise: part('mediafire'),
  MyBiGF: part('mediafire'),
  // Lista de Pixeldrain con las versiones Windows/Mac/Linux: es 1 sola descarga
  NamiUnforgivingNightmare: part('pixeldrain'),
  NEMESISOFNELVA: part('pixeldrain'),
  AssistanceMatters: part('buzzheavier'),
  KotegawaYui: part('workupload'),
  erotocskills: part('mediafire'),
  abandonedaunt: part('pixeldrain'),
  MonsterGirlsDiceBoard: part('mediafire'),
  HoneyTrapPrison: part('workupload'),
  ConfesstoMe: part('mediafire'),
  completemolester2: part('mediafire'),
  Maruhadaka: part('mediafire'),
  hypnoworker: part('buzzheavier'),
  priscilla: part('mediafire'),
  juegoh4: part('mediafire'),
  guardianbattle: part('pixeldrain'),
  juegoh3: part('mediafire'),
  sinfulnuns: part('mediafire'),
  GRANDTIDDYADVENTURES: part('mediafire'),
  // Página oficial de descarga del emulador
  NL8biDcp: part('official'),
  Ve5Luc: part('marketcat', 14),
  lBeRt4: part('gdrive', 6),
  mxiEXNqb: part('gdrive', 5),
  '79nbZom': part('mediafire'),
  Gt3oU: part('mediafire'),
  '9c7b0GDa': part('romsfun'),
  JOdW: part('mega'),
  '7NkTC': part('romsfun'),
  GlSjLgd: part('romsfun'),
  CZV9B: part('romsfun'),
  qNtb3: part('romsfun'),
  QdX34un6: part('romsfun'),
  AkALsU3: part('romsfun'),
  TlIZXS: part('romsfun'),
  YvRVU79: part('romsfun'),
  '2pvBQSCT': part('romsfun'),
  eVBNWbH: part('romsfun'),
  Gwojc: part('romsfun'),
  hgeuxP: part('romsfun'),
  xCMnTb: part('romsfun'),
  of2q: part('romsfun'),
  erFHBL: part('romsfun'),
  oKNvYR: part('mediafire', 18),
  '41lzRW': part('gdrive', 24),
  NuoB5Zq2: part('mediafire'),
  DMFrpy9: part('mediafire'),
  FNDWEgh: part('mediafire'),
  pw3aXg: part('marketcat'),
  YBB6wiT: part('gofile'),
  jQJQq3z: part('mediafire'),
  n5vjkM: part('mediafire'),
  Dx8hkMuu: part('gofile'),
  GuXYFxwR: part('mediafire'),
  ad3Elm: part('mediafire'),
  ezAt9j: part('mediafire', 16),
  IMxYo: part('marketcat', 27),
  WyYFJ9K: part('buzzheavier', 6),
  // .txt con 2 carpetas de MediaFire
  vzpyKeb: part('mediafire', 2),
  BxBxDGl: part('mediafire', 9),
  P0cRSHx: part('mediafire'),
  MdIjne: part('mediafire'),
  ex1vOuKg: part('1fichier'),
  aOb8IA4: part('gofile'),
  '9eK2erqM': part('gofile'),
  ZyTzmvxG: part('gofile'),
  DmlCs: part('mediafire'),
  AYEKP: part('mediafire'),
  '663Cs': part('mediafire'),
  S7RtQ: part('mediafire'),
  '4wttrINe': part('1fichier'),
  Blg1gfe: part('mediafire'),
  tb4Es: part('1fichier'),
};

export class AddDownloadHostsToCatalogItems1700000000016 implements MigrationInterface {
  name = 'AddDownloadHostsToCatalogItems1700000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "catalog_items"
      ADD COLUMN IF NOT EXISTS "download_hosts" JSONB NULL;
    `);

    for (const [alias, hosts] of Object.entries(EXE_IO_HOSTS)) {
      await queryRunner.query(
        `UPDATE "catalog_items"
         SET "download_hosts" = $1::jsonb
         WHERE "download_url" = $2 AND "download_hosts" IS NULL`,
        [JSON.stringify(hosts), `https://exe.io/${alias}`],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "catalog_items"
      DROP COLUMN IF EXISTS "download_hosts";
    `);
  }
}
