// ============================================================
// admin-tools/generate-revocation.cjs
// ⭐ GÉNÉRATION DE LISTE DE RÉVOCATION - VERSION AVEC SIGNATURE
// ============================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('═'.repeat(80));
console.log('🚫 GÉNÉRATION DE LISTE DE RÉVOCATION');
console.log('═'.repeat(80));

// ⭐ Charger la private key pour signer la revocation list
const privateKeyPath = path.join(__dirname, 'keys', 'private.pem');
if (!fs.existsSync(privateKeyPath)) {
  console.error('❌ Private Key tsy hita!');
  console.error(`   Mila mamorona aloha: node generate-keys.cjs`);
  process.exit(1);
}
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

// ⭐ Charger les licences
const licensesDir = path.join(__dirname, 'licenses_secure');
if (!fs.existsSync(licensesDir)) {
  console.error('❌ Aucune licence trouvée. Générer d\'abord les licences.');
  process.exit(1);
}

// ⭐ Trouver le dernier fichier JSON
const jsonFiles = fs.readdirSync(licensesDir).filter(f => f.endsWith('.json') && f.startsWith('licences_secure'));
if (jsonFiles.length === 0) {
  console.error('❌ Aucun fichier JSON trouvé.');
  process.exit(1);
}

const latestJson = jsonFiles.sort().pop();
const fullData = JSON.parse(fs.readFileSync(path.join(licensesDir, latestJson), 'utf8'));

// ⭐ Fonction pour révoquer une licence
function revokeLicense(licenseKey, reason = 'Révocation manuelle') {
  const revoked = {
    licenseKey: licenseKey,
    reason: reason,
    revokedAt: new Date().toISOString(),
    revokedBy: 'admin',
  };
  return revoked;
}

// ⭐ Signature de la revocation list
function signRevocationList(data) {
  const sign = crypto.createSign('RSA-SHA256');
  const canonicalString = createCanonicalString(data);
  sign.update(canonicalString);
  sign.end();
  return sign.sign({
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 32,
  }, 'base64');
}

function createCanonicalString(data) {
  const keys = Object.keys(data).filter(k => k !== 'signature').sort();
  const parts = keys.map(key => `${key}=${data[key]}`);
  return parts.join('&');
}

// ⭐ Exemple: Révoquer les 5 premières licences basic
const revokedLicenses = [];
let count = 0;

// Extraire les licences de la structure
let allLicenses = [];
for (const [pkgType, pkgData] of Object.entries(fullData.packages || fullData)) {
  if (pkgData.licenses && Array.isArray(pkgData.licenses)) {
    for (const lic of pkgData.licenses) {
      allLicenses.push({ ...lic, packageType: pkgType });
    }
  }
}

// Révoquer 5 licences basic
for (const lic of allLicenses) {
  if (lic.packageType === 'basic' && count < 5) {
    revokedLicenses.push(revokeLicense(lic.licenseKey, 'Exemple de révocation'));
    count++;
  }
}

// ⭐ Structure avec version et signature
const revocationData = {
  version: 1,
  updatedAt: new Date().toISOString(),
  totalRevoked: revokedLicenses.length,
  licenses: revokedLicenses,
  activations: [], // Pour les activations révoquées
};

// ⭐ Signer la revocation list
revocationData.signature = signRevocationList(revocationData);

// ⭐ Sauvegarder
const outputPath = path.join(__dirname, 'revoked.json');
fs.writeFileSync(outputPath, JSON.stringify(revocationData, null, 2));

console.log(`✅ ${revokedLicenses.length} licence(s) révoquées`);
console.log(`📁 ${outputPath}`);
console.log(`🔐 Signature: ${revocationData.signature.substring(0, 32)}...`);

// ⭐ Afficher les licences révoquées
console.log('\n📋 LICENCES RÉVOQUÉES:');
revokedLicenses.forEach((r, i) => {
  console.log(`   ${i+1}. ${r.licenseKey} - ${r.reason}`);
});
console.log('');