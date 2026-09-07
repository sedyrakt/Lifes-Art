// ============================================================
// admin-tools/generate-activation-code.cjs
// ⭐ GÉNÉRATION DE CODE D'ACTIVATION SIGNÉ RSA
// ⭐ Format: LA-XXXX-XXXX-XXXX (17 caractères)
// ⭐ FANITSARA: Mifanaraka 100% amin'ny Client
// ============================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ⭐ CONSTANTES
const PACKAGES = {
  test: { id: 'test', name: 'Test (30 min)', prefix: 'TS', duration: 0, maxUsers: 1, maxProducts: 5, maxClients: 3, isTest: true, isLifetime: false, defaultQuantity: 100 },
  basic: { id: 'basic', name: 'Basic', prefix: 'BS', duration: 30, maxUsers: 1, maxProducts: 100, maxClients: 50, isTest: false, isLifetime: false, defaultQuantity: 100 },
  standard: { id: 'standard', name: 'Standard', prefix: 'ST', duration: 60, maxUsers: 3, maxProducts: 500, maxClients: 200, isTest: false, isLifetime: false, defaultQuantity: 100 },
  premium: { id: 'premium', name: 'Premium', prefix: 'PR', duration: 365, maxUsers: 10, maxProducts: -1, maxClients: -1, isTest: false, isLifetime: false, defaultQuantity: 100 },
  national: { id: 'national', name: 'National', prefix: 'NA', duration: 730, maxUsers: 25, maxProducts: -1, maxClients: -1, isTest: false, isLifetime: false, defaultQuantity: 100 },
  centralized: { id: 'centralized', name: 'Centralized', prefix: 'CE', duration: -1, maxUsers: -1, maxProducts: -1, maxClients: -1, isTest: false, isLifetime: true, defaultQuantity: 1 },
};

// ⭐ CHEMIN DE LA CLÉ PRIVÉE
const PRIVATE_KEY_PATH = path.join(__dirname, 'keys', 'private.pem');
const PUBLIC_KEY_PATH = path.join(__dirname, 'keys', 'public.pem');

// ⭐ CHARGER LA CLÉ PRIVÉE
function loadPrivateKey() {
  try {
    if (!fs.existsSync(PRIVATE_KEY_PATH)) {
      throw new Error('Clé privée non trouvée');
    }
    return fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  } catch (error) {
    console.error('❌ Erreur chargement clé privée:', error.message);
    console.error('   Générez d\'abord les clés: node generate-keys.cjs');
    process.exit(1);
  }
}

// ⭐ FONCTION CANONIQUE
function createCanonicalString(data) {
  const keys = Object.keys(data).filter(k => k !== 'signature').sort();
  const parts = keys.map(key => `${key}=${String(data[key])}`);
  return parts.join('&');
}

// ⭐ SIGNER LE PAYLOAD AVEC RSA
function signPayload(payload) {
  const privateKey = loadPrivateKey();
  const canonicalString = createCanonicalString(payload);
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(canonicalString);
  sign.end();
  
  return sign.sign({
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 32,
  }, 'base64');
}

// ⭐ GÉNÉRER UN CHUNK ALOÉATOIRE
function generateChunk() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars[crypto.randomInt(chars.length)];
  }
  return result;
}

// ⭐ GÉNÉRER LE CODE D'ACTIVATION
function generateActivationCode(packageType, machineId = null) {
  try {
    if (!PACKAGES[packageType]) {
      return { success: false, error: `Package invalide: ${packageType}` };
    }

    const pkg = PACKAGES[packageType];
    
    // ⭐ Générer les chunks
    const chunk1 = generateChunk();
    const chunk2 = generateChunk();
    const chunk3 = generateChunk();
    
    // ⭐ Encoder le package
    const packageCode = pkg.prefix;
    const chunk1WithPackage = packageCode + chunk1.substring(0, 2);
    
    // ⭐ Générer IDs
    const licenseId = `LIC-${pkg.prefix}-${chunk1WithPackage}${chunk2}`;
    const activationId = `${chunk1WithPackage}${chunk2}${chunk3}`;

    // ⭐ Calculer expiration
    const now = new Date();
    let expirationDate;
    if (pkg.isTest) {
      expirationDate = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    } else if (pkg.duration === -1) {
      expirationDate = '2099-12-31T23:59:59.999Z';
    } else {
      expirationDate = new Date(now.getTime() + pkg.duration * 24 * 60 * 60 * 1000).toISOString();
    }

    // ⭐ PAYLOAD (TSY MISY isLifetime/isTest)
    const payload = {
      licenseId: licenseId,
      activationId: activationId,
      licenseKey: `LA-${chunk1WithPackage}-${chunk2}-${chunk3}`,
      packageType: packageType,
      expirationDate: expirationDate,
      issuedAt: now.toISOString(),
      maxUsers: pkg.maxUsers,
      maxProducts: pkg.maxProducts,
      maxClients: pkg.maxClients,
    };
    
    // ⭐ SIGNER LE PAYLOAD AVEC RSA
    const signature = signPayload(payload);
    
    // ⭐ CODE FINAL
    const code = payload.licenseKey;
    
    return {
      success: true,
      code: code,
      signature: signature,
      payload: payload,
      packageType: packageType,
      packageName: pkg.name,
      expirationDate: expirationDate,
    };
  } catch (error) {
    console.error('❌ Erreur génération:', error.message);
    return { success: false, error: error.message };
  }
}

// ⭐ GÉNÉRER PLUSIEURS CODES
function generateBatchCodes(packageType, quantity = null) {
  try {
    if (!PACKAGES[packageType]) {
      return { success: false, error: `Package invalide: ${packageType}` };
    }

    const pkg = PACKAGES[packageType];
    
    if (quantity === null) quantity = pkg.defaultQuantity;
    if (packageType === 'centralized') quantity = 1;
    if (quantity > 100) quantity = 100;

    const codes = [];
    const seenCodes = new Set();

    for (let i = 0; i < quantity; i++) {
      let result;
      let attempts = 0;
      
      do {
        result = generateActivationCode(packageType);
        attempts++;
      } while (seenCodes.has(result.code) && attempts < 10);
      
      if (result.success) {
        seenCodes.add(result.code);
        codes.push(result);
      }
    }

    return {
      success: true,
      quantity: codes.length,
      codes: codes,
      packageType: packageType,
      packageName: pkg.name,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ⭐ CLI
if (require.main === module) {
  console.log('═══════════════════════════════════════════════');
  console.log('🔑 GÉNÉRATION DE CODE D\'ACTIVATION SIGNÉ RSA');
  console.log('═══════════════════════════════════════════════');
  
  const args = process.argv.slice(2);
  let packageType = null;
  let quantity = null;
  
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error('❌ CLÉ PRIVÉE NON TROUVÉE!');
    console.error('   Générez d\'abord les clés: node generate-keys.cjs');
    process.exit(1);
  }
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--package' && args[i+1]) packageType = args[i+1];
    if (args[i] === '--quantity' && args[i+1]) quantity = parseInt(args[i+1]);
    if (args[i] === '--list-packages') {
      console.log('\n📦 Packages disponibles :');
      console.log('═══════════════════════════════════════════════');
      for (const [id, pkg] of Object.entries(PACKAGES)) {
        console.log(`   ${id.padEnd(12)} ${pkg.name.padEnd(20)} ${pkg.defaultQuantity} licences`);
      }
      console.log('═══════════════════════════════════════════════');
      process.exit(0);
    }
  }
  
  if (!packageType) {
    console.log('\n🎫 Génération de codes pour TOUS les packages...\n');
    
    let allCodes = [];
    let totalGenerated = 0;
    
    for (const [type, pkg] of Object.entries(PACKAGES)) {
      console.log(`📦 ${pkg.name}...`);
      
      const result = generateBatchCodes(type, null);
      
      if (result.success) {
        console.log(`   ✅ ${result.quantity} codes générés (signés RSA)`);
        allCodes.push(...result.codes);
        totalGenerated += result.quantity;
      } else {
        console.log(`   ❌ Erreur: ${result.error}`);
      }
    }
    
    // ⭐ Sauvegarder
    const outputDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const timestamp = Date.now();
    
    const jsonPath = path.join(outputDir, `activation_codes_ALL_${timestamp}.json`);
    const jsonData = {
      generatedAt: new Date().toISOString(),
      total: totalGenerated,
      codes: allCodes.map(c => ({
        code: c.code,
        signature: c.signature,
        payload: c.payload,
      })),
    };
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
    
    const txtPath = path.join(outputDir, `activation_codes_ALL_${timestamp}.txt`);
    let txtContent = `# ═══════════════════════════════════════════════
# CODES D'ACTIVATION GÉNÉRÉS (TOUS PACKAGES)
# Date: ${new Date().toISOString()}
# Total: ${totalGenerated} codes
# ═══════════════════════════════════════════════

`;
    
    let currentPackage = '';
    for (const c of allCodes) {
      if (c.packageName !== currentPackage) {
        currentPackage = c.packageName;
        txtContent += `\n═══ ${currentPackage.toUpperCase()} ═══\n\n`;
      }
      txtContent += `${c.code}\n`;
    }
    fs.writeFileSync(txtPath, txtContent, 'utf8');
    
    console.log('\n═══════════════════════════════════════════════');
    console.log(`✅ TOTAL: ${totalGenerated} codes générés et signés RSA`);
    console.log(`📁 JSON: ${jsonPath}`);
    console.log(`📁 TXT:  ${txtPath}`);
    console.log('═══════════════════════════════════════════════');
    
    console.log('\n📋 APERÇU DES CODES:');
    let previewCount = 0;
    for (const c of allCodes) {
      if (previewCount < 20) {
        console.log(`   ${c.code}  (${c.packageName})`);
        previewCount++;
      }
    }
    if (totalGenerated > 20) {
      console.log(`   ... et ${totalGenerated - 20} autres codes`);
    }
    
  } else {
    const pkg = PACKAGES[packageType];
    if (!pkg) {
      console.error(`❌ Package invalide: ${packageType}`);
      process.exit(1);
    }
    
    if (quantity === null) quantity = pkg.defaultQuantity;
    if (packageType === 'centralized') quantity = 1;
    
    console.log(`\n📦 Package: ${pkg.name}`);
    console.log(`🔢 Quantité: ${quantity}`);
    console.log('═══════════════════════════════════════════════');
    
    const result = generateBatchCodes(packageType, quantity);
    
    if (!result.success) {
      console.error(`❌ Erreur: ${result.error}`);
      process.exit(1);
    }
    
    console.log(`\n🎫 CODES D'ACTIVATION GÉNÉRÉS:\n`);
    
    for (let i = 0; i < result.codes.length; i++) {
      console.log(`   ${String(i + 1).padStart(3)}. ${result.codes[i].code}`);
    }
    
    const outputDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const timestamp = Date.now();
    
    const jsonPath = path.join(outputDir, `activation_codes_${packageType}_${timestamp}.json`);
    const jsonData = {
      generatedAt: new Date().toISOString(),
      packageType: packageType,
      packageName: pkg.name,
      quantity: result.codes.length,
      codes: result.codes.map(c => ({
        code: c.code,
        signature: c.signature,
        payload: c.payload,
      })),
    };
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
    
    const txtPath = path.join(outputDir, `activation_codes_${packageType}_${timestamp}.txt`);
    let txtContent = `# ═══════════════════════════════════════════════
# CODES D'ACTIVATION ${pkg.name.toUpperCase()}
# Date: ${new Date().toISOString()}
# Quantité: ${result.codes.length}
# ═══════════════════════════════════════════════

`;
    result.codes.forEach((c, i) => {
      txtContent += `${String(i + 1).padStart(3)}. ${c.code}\n`;
    });
    fs.writeFileSync(txtPath, txtContent, 'utf8');
    
    console.log(`\n📁 JSON: ${jsonPath}`);
    console.log(`📁 TXT:  ${txtPath}`);
    console.log('═══════════════════════════════════════════════');
  }
}

// ⭐ EXPORTS
module.exports = {
  generateActivationCode,
  generateBatchCodes,
  PACKAGES,
};