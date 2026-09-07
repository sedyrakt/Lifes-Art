// ============================================================
// admin-tools/generate-masse.cjs
// ⭐ GÉNÉRATION EN MASSE (1000 par package) - HO AN'NY TSY MILA MACHINE BINDING
// ============================================================

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { generateSecureLicense } = require('./generate-licenses-secure.cjs');

console.log('📦 GÉNÉRATION EN MASSE DE LICENCES (1000 PAR PACKAGE)');
const keysDir = path.join(__dirname, 'keys');
if (!fs.existsSync(path.join(keysDir, 'private.pem'))) {
  console.log('⚠️ Clés RSA non trouvées. Génération automatique...');
  execSync('node generate-keys.cjs', { stdio: 'inherit' });
}

const outputDir = path.join(__dirname, 'licenses_secure');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const PACKAGES_TO_GENERATE = ['test', 'basic', 'standard', 'premium', 'national', 'centralized'];
const COUNT_PER_PACKAGE = 1000;
const existingKeys = new Set();
const allLicenses = {};

for (const pkgKey of PACKAGES_TO_GENERATE) {
  console.log(`⏳ Génération de ${COUNT_PER_PACKAGE} licences pour ${pkgKey.toUpperCase()}...`);
  const licenses = [];
  for (let i = 0; i < COUNT_PER_PACKAGE; i++) {
    const license = generateSecureLicense(pkgKey, i, existingKeys);
    licenses.push(license);
  }
  allLicenses[pkgKey] = licenses;
  fs.writeFileSync(path.join(outputDir, `licenses_${pkgKey}.json`), JSON.stringify(licenses, null, 2));
}

fs.writeFileSync(path.join(outputDir, 'all_licenses_master.json'), JSON.stringify(allLicenses, null, 2));
console.log('✅ Génération en masse terminée!');