// ============================================================
// admin-tools/generate-integrity.cjs
// ⭐ Mamorona hashes.json sy hashes.sig ho an'ny integrity check
// ⭐ FIX: Hash ny dist-electron/ raha misy, fa tsy ny electron/
// ============================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PRIVATE_KEY_PATH = path.join(__dirname, 'keys', 'private.pem');


const distDir = path.join(ROOT, 'dist-electron');
const sourceDir = fs.existsSync(distDir) ? distDir : path.join(ROOT, 'electron');
const outputDir = fs.existsSync(distDir)
  ? path.join(distDir, 'generated')
  : path.join(ROOT, 'electron', 'generated');


const FILES_TO_HASH = [
  'main.cjs',
  'preload.cjs',
  'ipc/**/*.cjs',
  'services/**/*.cjs',
  'database/**/*.cjs',
  'utils/**/*.cjs',
  'keys/public.pem',
  'config/**/*.json',
];

// Hamarino fa misy ny private key
if (!fs.existsSync(PRIVATE_KEY_PATH)) {
  console.error('❌ private.pem tsy hita!');
  process.exit(1);
}

const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

// ⭐ Fonction hamorona canonical string (mitovy amin'ny crypto.cjs)
function createCanonicalString(data) {
  const keys = Object.keys(data).filter(k => k !== 'signature').sort();
  const parts = keys.map(key => `${key}=${String(data[key])}`);
  return parts.join('&');
}

// ⭐ Collecter les fichiers (filter .cjs .jsc .json)
function collectFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip ny keys/ sy generated/ (mety misy hash taloha)
      if (entry.name === 'keys' || entry.name === 'generated') continue;
      results.push(...collectFiles(fullPath));
    } else if (entry.isFile()) {
      if (/\.(cjs|jsc|json)$/.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

// ⭐ Mamorona hashes
function generateHashes() {
  const files = collectFiles(sourceDir);
  const hashes = {};
  for (const filePath of files) {
    const relativePath = path.relative(sourceDir, filePath);
    const content = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    hashes[relativePath] = hash;
  }

  const metadata = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    publicKeyHash: getPublicKeyHash(),
    target: fs.existsSync(distDir) ? 'dist-electron' : 'electron',
  };

  return {
    metadata: metadata,
    files: hashes,
  };
}

function getPublicKeyHash() {
  const publicKeyPath = path.join(ROOT, 'electron/keys/public.pem');
  const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
  return crypto.createHash('sha256').update(publicKey).digest('hex');
}

// ⭐ Sonner ny hashes
function signData(data) {
  const canonical = createCanonicalString(data);
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(canonical);
  sign.end();
  return sign.sign({
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 32,
  }, 'base64');
}

// ⭐ Main
function main() {
  // Mamorona ny dossier output
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const data = generateHashes();
  const signature = signData(data);

  // Save hashes.json
  const hashesPath = path.join(outputDir, 'hashes.json');
  fs.writeFileSync(hashesPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ hashes.json voaforona: ${hashesPath}`);

  // Save hashes.sig
  const sigPath = path.join(outputDir, 'hashes.sig');
  fs.writeFileSync(sigPath, signature, 'utf8');
  console.log(`✅ hashes.sig voaforona: ${sigPath}`);

  console.log('   ⚠️ Aza adino ny mamerina ny build raha efa nisy build taloha.');
}

main();