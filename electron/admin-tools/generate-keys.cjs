// ============================================================
// admin-tools/generate-keys.cjs
// ⭐ GÉNÉRATION DES CLÉS RSA - PRODUCTION SECURE
// ============================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEYS_DIR = path.join(__dirname, 'keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.pem');
const FINGERPRINT_PATH = path.join(KEYS_DIR, 'fingerprint.txt');

if (fs.existsSync(PRIVATE_KEY_PATH) || fs.existsSync(PUBLIC_KEY_PATH)) {
  console.error('❌ DES CLÉS RSA EXISTENT DÉJÀ');
  console.error('   Pour générer de nouvelles clés, supprimez-les d\'abord: rm -rf admin-tools/keys/');
  process.exit(1);
}

console.log('🔑 GÉNÉRATION DES CLÉS RSA (PSS)');
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

if (!fs.existsSync(KEYS_DIR)) fs.mkdirSync(KEYS_DIR, { recursive: true });

fs.writeFileSync(PRIVATE_KEY_PATH, privateKey);
fs.chmodSync(PRIVATE_KEY_PATH, 0o600);
console.log('✅ Private Key sauvegardée: keys/private.pem (mode 600)');

fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);
fs.chmodSync(PUBLIC_KEY_PATH, 0o644);
console.log('✅ Public Key sauvegardée: keys/public.pem (mode 644)');

const publicKeyHash = crypto.createHash('sha256').update(publicKey).digest('hex');
fs.writeFileSync(FINGERPRINT_PATH, publicKeyHash);
fs.chmodSync(FINGERPRINT_PATH, 0o644);
console.log('✅ Fingerprint sauvegardé: keys/fingerprint.txt');

console.log('🔐 EMPREINTE Public Key:', publicKeyHash.substring(0, 32) + '...');
console.log('📐 RSA-PSS 4096 / SHA256 / SaltLength 32');
console.log('');
console.log('⚠️ GARDEZ LA CLÉ PRIVÉE SECRÈTE!');
console.log('   NE JAMAIS DISTRIBUER keys/private.pem');
console.log('   Seul l\'admin doit avoir cette clé');
console.log('');

module.exports = {
  privateKeyPath: PRIVATE_KEY_PATH,
  publicKeyPath: PUBLIC_KEY_PATH,
  fingerprintPath: FINGERPRINT_PATH,
  publicKeyHash: publicKeyHash,
};