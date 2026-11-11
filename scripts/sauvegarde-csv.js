// Sauvegarde quotidienne des tables du site en fichiers CSV, rangés dans l'espace privé « sauvegardes » de
// Supabase Storage (un dossier par jour, 30 jours conservés). Lancé chaque nuit par
// .github/workflows/sauvegarde-csv.yml ; peut aussi être lancé à la main :
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SECRET_KEY=sb_secret_… node scripts/sauvegarde-csv.js
//
// Les données ne sont jamais écrites sur GitHub ni affichées dans les journaux : seulement le nombre de lignes.
// CSV prévu pour Excel en français : séparateur « ; », encodage UTF-8 avec BOM.

const TABLES = ['profiles', 'prestataires', 'reservations', 'promo_codes', 'settings'];
const BUCKET = 'sauvegardes';
const KEEP_DAYS = 30;
const PAGE_SIZE = 1000;

const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/(rest|auth)\/v1$/, '');
const key = (process.env.SUPABASE_SECRET_KEY || '').trim();

// Nouvelle clé (sb_secret_…) : seulement dans apikey ; ancienne clé service_role (eyJ…) : aussi dans Authorization
const headers = (extra = {}) => ({
  apikey: key,
  ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}),
  ...extra
});

const fail = async (what, response) => {
  const detail = await response.text().catch(() => '');
  throw new Error(`${what} : code ${response.status} ${detail.slice(0, 200)}`);
};

// Date du jour à Paris, au format AAAA-MM-JJ
const todayInParis = (now = new Date()) =>
  new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

// Toutes les lignes d'une table, par pages de 1000
const fetchAll = async (table) => {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const response = await fetch(`${url}/rest/v1/${table}?select=*&order=id&limit=${PAGE_SIZE}&offset=${offset}`, {
      headers: headers()
    });
    if (!response.ok) await fail(`Lecture de la table ${table}`, response);
    const page = await response.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
};

// Une cellule CSV : objets en JSON, guillemets si besoin, et protection contre les formules Excel
// (=, @, ou + / - suivis d'autre chose qu'un chiffre : un numéro « +33 6… » reste lisible)
const cell = (value) => {
  if (value === null || value === undefined) return '';
  let text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (typeof value === 'string' && /^(=|@|[+-][^\d\s]|\t|\r)/.test(text)) text = `'${text}`;
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toCsv = (rows) => {
  const columns = [];
  rows.forEach(row => Object.keys(row).forEach(column => {
    if (!columns.includes(column)) columns.push(column);
  }));
  const lines = [columns.map(cell).join(';'), ...rows.map(row => columns.map(column => cell(row[column])).join(';'))];
  return '﻿' + (columns.length ? lines.join('\r\n') + '\r\n' : '');
};

const upload = async (path, csv) => {
  const response = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'text/csv', 'x-upsert': 'true' }),
    body: Buffer.from(csv, 'utf8')
  });
  if (!response.ok) await fail(`Dépôt de ${path}`, response);
};

const list = async (prefix) => {
  const response = await fetch(`${url}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prefix, limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } })
  });
  if (!response.ok) await fail(`Liste de ${prefix || 'la racine'}`, response);
  return response.json();
};

const remove = async (paths) => {
  const response = await fetch(`${url}/storage/v1/object/${BUCKET}`, {
    method: 'DELETE',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prefixes: paths })
  });
  if (!response.ok) await fail('Suppression des anciennes sauvegardes', response);
};

// Efface les dossiers de plus de KEEP_DAYS jours
const removeOldBackups = async (today) => {
  const limit = new Date(`${today}T00:00:00Z`);
  limit.setUTCDate(limit.getUTCDate() - KEEP_DAYS);
  const cutoff = limit.toISOString().slice(0, 10);
  const folders = (await list('')).map(entry => entry.name).filter(name => /^\d{4}-\d{2}-\d{2}$/.test(name) && name < cutoff);
  for (const folder of folders) {
    const files = (await list(folder)).map(entry => `${folder}/${entry.name}`);
    if (files.length) await remove(files);
  }
  return folders;
};

const main = async () => {
  if (!url || !key) throw new Error('SUPABASE_URL ou SUPABASE_SECRET_KEY manquant');
  if (key.startsWith('sb_publishable_')) throw new Error('SUPABASE_SECRET_KEY contient la clé publique : il faut la clé secrète (sb_secret_…)');
  const today = todayInParis();
  for (const table of TABLES) {
    const rows = await fetchAll(table);
    await upload(`${today}/${table}.csv`, toCsv(rows));
    console.log(`${table} : ${rows.length} ligne(s) sauvegardée(s)`);
  }
  const removed = await removeOldBackups(today);
  console.log(`Sauvegarde du ${today} terminée${removed.length ? ` ; anciens dossiers effacés : ${removed.join(', ')}` : ''}`);
};

if (require.main === module) {
  main().catch(error => {
    console.error(`::error::${error.message}`);
    process.exit(1);
  });
}

module.exports = { cell, toCsv, todayInParis, main, removeOldBackups };
