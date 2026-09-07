// ============================================================
// admin-tools/build-codes-db.cjs
// ⭐ Mamadika ny JSON navoakan'ny generate-activation-code.cjs
//    ho codes.db.enc (fixed-key encryption)
// ============================================================

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================
// ⭐ FIXED SECRET (OVAIO HO STRING LAVA SY RANDOM)
// Tsy maintsy mitovy amin'ny an'ny client (activation.cjs)
// ============================================================
const CODES_DB_SECRET = 'njkwrfkxiszaqplmwert_7gH4%jK9#pL2$mN6@qR8&sT3*vW5!xY1+zA0=bC4-eF7';
const CODES_DB_SALT = Buffer.from('FITAIA-CODES-SALT-V1', 'utf8');

function getCodesAESKey() {
  return crypto.pbkdf2Sync(CODES_DB_SECRET, CODES_DB_SALT, 210000, 32, 'sha512');
}

function encryptCodesDB(data) {
  const key = getCodesAESKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return iv.toString('base64') + ':' + authTag.toString('base64') + ':' + encrypted;
}

// ============================================================
// MAIN
// ============================================================

function main() {
  const exportsDir = path.join(__dirname, 'exports');
  const outputPath = path.join(__dirname, '..', 'electron', 'keys', 'codes.db.enc');
  // Azonao ovaina ho: path.join(__dirname, 'codes.db.enc')

  if (!fs.existsSync(exportsDir)) {
    console.error('❌ Dossier exports/ tsy hita');
    process.exit(1);
  }

  // Maka ny JSON farany indrindra
  const files = fs.readdirSync(exportsDir)
    .filter(f => f.startsWith('activation_codes_') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      full: path.join(exportsDir, f),
      mtime: fs.statSync(path.join(exportsDir, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) {
    console.error('❌ Tsy misy fichier activation_codes_*.json ao amin\'ny exports/');
    process.exit(1);
  }

  console.log('📂 Fichiers hita:');
  files.forEach(f => console.log('   -', f.name));

  // Ampiasaina ny farany indrindra (na azonao atao loop rehetra)
  const latest = files[0];
  console.log(`\n🔄 Mampiasa: ${latest.name}`);

  const raw = fs.readFileSync(latest.full, 'utf8');
  const json = JSON.parse(raw);

  if (!json.codes || !Array.isArray(json.codes)) {
    console.error('❌ Format JSON tsy mety (codes[] tsy hita)');
    process.exit(1);
  }

  // Build map: code → { payload, signature }
  const codesMap = {};

  for (const entry of json.codes) {
    if (!entry.code || !entry.signature || !entry.payload) {
      console.warn('⚠️ Entry tsy feno, skip:', entry.code || '???');
      continue;
    }
    codesMap[entry.code.toUpperCase()] = {
      payload: entry.payload,
      signature: entry.signature,
    };
  }

  const db = {
    version: 1,
    generatedAt: json.generatedAt || new Date().toISOString(),
    total: Object.keys(codesMap).length,
    codes: codesMap,
  };

  console.log(`✅ ${db.total} codes nampidirina`);

  // Encrypt
  const encrypted = encryptCodesDB(db);

  // Save
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(outputPath, encrypted, 'utf8');
  console.log(`\n✅ codes.db.enc voaforona: ${outputPath}`);
  console.log('   Aza adino ny manampy azy ao amin\'ny electron-builder (extraResources na files)');
}

main();