

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

console.log('═'.repeat(80));
console.log('🔒 BUILD COMPLET: BYTENODE + OBFUSCATION');
console.log('═'.repeat(80));

const distDir = path.join(__dirname, 'dist-electron');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

// ============================================================
// 1. BYTENODE COMPILATION (fichiers license)
// ============================================================
const bytenodeFiles = [
  'electron/services/license/crypto.cjs',
  'electron/services/license/machine.cjs',
  'electron/services/license/activation.cjs',
  'electron/services/license/validation.cjs',
  'electron/services/license/file.cjs',
];

console.log('\n📦 Étape 1: Compilation Bytenode...');
for (const rel of bytenodeFiles) {
  const src = path.join(__dirname, rel);
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠️ Tsy hita: ${rel}`);
    continue;
  }
  try {
    // Compile .cjs -> .jsc (ao amin'ny source)
    execSync(`npx bytenode --compile "${src}"`, { stdio: 'inherit' });
    console.log(`  ✅ ${path.basename(src)} → .jsc`);
  } catch (err) {
    console.error(`  ❌ Erreur compilation ${rel}:`, err.message);
  }
}

// ============================================================
// 2. OBFUSCATION (main, preload, ipc, services, database, utils)
// ============================================================
const isProduction = Boolean(process.resourcesPath) || process.env.NODE_ENV === 'production';

const getObfuscationConfig = (isPreload = false) => ({
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.25,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: isProduction,
  identifierNamesGenerator: 'hexadecimal',
  numbersToExpressions: true,
  renameGlobals: false,
  renameProperties: false,
  selfDefending: false,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 1,
  unicodeEscapeSequence: false,
});

function obfuscateFile(filePath, outputPath, isPreload = false) {
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️ Fichier non trouvé: ${filePath}`);
    return false;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const config = getObfuscationConfig(isPreload);
    const obfuscated = JavaScriptObfuscator.obfuscate(content, config);
    const code = typeof obfuscated === 'string' ? obfuscated : (obfuscated.getObfuscatedCode ? obfuscated.getObfuscatedCode() : obfuscated.toString());

    const targetDir = path.dirname(outputPath);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(outputPath, code);
    return true;
  } catch (error) {
    console.error(`  ❌ Erreur obfuscation ${path.basename(filePath)}:`, error.message);
    return false;
  }
}

function obfuscateDirectoryRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      obfuscateDirectoryRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.cjs')) {
        const success = obfuscateFile(srcPath, destPath, false);
        if (success) console.log(`   🔒 Obfusqué: ${path.relative(path.join(__dirname, 'electron'), srcPath)}`);
      } else {
        // .jsc, .json, .pem, .db.enc, etc.
        fs.copyFileSync(srcPath, destPath);
        console.log(`   📄 Copié: ${path.relative(path.join(__dirname, 'electron'), srcPath)}`);
      }
    }
  }
}

console.log('\n📦 Étape 2: Obfuscation...');
// main.cjs
const mainPath = path.join(__dirname, 'electron/main.cjs');
if (fs.existsSync(mainPath)) {
  obfuscateFile(mainPath, path.join(distDir, 'main.cjs'), false);
  console.log('   ✅ main.cjs');
} else {
  console.error('   ❌ main.cjs tsy hita!');
}

// preload.cjs
const preloadPath = path.join(__dirname, 'electron/preload.cjs');
if (fs.existsSync(preloadPath)) {
  obfuscateFile(preloadPath, path.join(distDir, 'preload.cjs'), true);
  console.log('   ✅ preload.cjs');
}

// Dossiers
const foldersToProcess = ['database', 'ipc', 'services', 'utils'];
for (const folder of foldersToProcess) {
  const srcFolder = path.join(__dirname, 'electron', folder);
  const destFolder = path.join(distDir, folder);
  if (fs.existsSync(srcFolder)) {
    console.log(`\n   📁 ${folder}/`);
    obfuscateDirectoryRecursive(srcFolder, destFolder);
    console.log(`   ✅ ${folder}/ traité`);
  } else {
    console.log(`   ⚠️ ${folder}/ non trouvé`);
  }
}

// ============================================================
// 3. COPIE DES RESSOURCES
// ============================================================
console.log('\n📦 Étape 3: Copie des ressources...');
const distKeysDest = path.join(distDir, 'keys');

// ⭐ PRIORITÉ: electron/keys (public.pem + codes.db.enc)
const electronKeysSrc = path.join(__dirname, 'electron/keys');
if (fs.existsSync(electronKeysSrc)) {
  if (fs.existsSync(distKeysDest)) fs.rmSync(distKeysDest, { recursive: true, force: true });
  fs.cpSync(electronKeysSrc, distKeysDest, { recursive: true });
  console.log('   ✅ electron/keys/ copié');
} else {
  console.warn('   ⚠️ electron/keys tsy hita');
}

// Fallback: admin-tools/keys
const adminKeysSrc = path.join(__dirname, 'admin-tools/keys');
if (!fs.existsSync(path.join(distKeysDest, 'public.pem')) && fs.existsSync(adminKeysSrc)) {
  if (!fs.existsSync(distKeysDest)) fs.mkdirSync(distKeysDest, { recursive: true });
  fs.cpSync(adminKeysSrc, distKeysDest, { recursive: true });
  console.log('   ✅ admin-tools/keys copié (fallback)');
}

// Exports
const exportsSrc = path.join(__dirname, 'admin-tools/exports');
const exportsDest = path.join(distDir, 'exports');
if (fs.existsSync(exportsSrc)) {
  if (fs.existsSync(exportsDest)) fs.rmSync(exportsDest, { recursive: true, force: true });
  fs.cpSync(exportsSrc, exportsDest, { recursive: true });
  console.log('   ✅ exports/ copié');
}

// Assets, config, resources (NIHAVA: esorina ny generated, satria ny script no mamorona)
const extraDirs = [
  { src: path.join(__dirname, 'electron/assets'), dest: path.join(distDir, 'assets') },
  { src: path.join(__dirname, 'electron/config'), dest: path.join(distDir, 'config') },
  // { src: path.join(__dirname, 'electron/generated'), dest: path.join(distDir, 'generated') }, // ⭐ COMMENTÉ: ny generate-integrity no mamorona
  { src: path.join(__dirname, 'resources'), dest: path.join(distDir, 'resources') },
];
for (const item of extraDirs) {
  if (fs.existsSync(item.src)) {
    if (fs.existsSync(item.dest)) fs.rmSync(item.dest, { recursive: true, force: true });
    fs.cpSync(item.src, item.dest, { recursive: true });
    console.log(`   ✅ ${path.basename(item.src)}/ copié`);
  }
}

// ============================================================
// 4. SUPPRESSION FICHIERS SENSIBLES
// ============================================================
console.log('\n🔒 Étape 4: Suppression des fichiers sensibles...');
const sensitive = [
  path.join(distDir, 'keys/private.pem'),
  path.join(distDir, 'keys/fingerprint.txt'),
];
for (const file of sensitive) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`   ✅ ${path.basename(file)} esorina`);
  } else {
    console.log(`   ✅ ${path.basename(file)} tsy hita`);
  }
}

// ============================================================
// 5. GÉNÉRATION DES HASHES (INTEGRITY) - NEW
// ⭐ Mampandeha ny generate-integrity.cjs aorian'ny build
// ============================================================
console.log('\n📦 Étape 5: Génération des hashes d\'intégrité...');
try {
  execSync('node admin-tools/generate-integrity.cjs', { stdio: 'inherit' });
  console.log('   ✅ hashes.json + hashes.sig voaforona');
} catch (err) {
  console.error('   ❌ Erreur lors de la génération des hashes:', err.message);
  process.exit(1);
}

// ============================================================
// 6. VÉRIFICATION FINALE
// ============================================================
console.log('\n🔍 Vérification finale...');
const requiredFiles = [
  path.join(distDir, 'keys/public.pem'),
  path.join(distDir, 'keys/codes.db.enc'),
  path.join(distDir, 'main.cjs'),
  path.join(distDir, 'generated/hashes.json'),   // ⭐ Nouveau
  path.join(distDir, 'generated/hashes.sig'),    // ⭐ Nouveau
];
let ok = true;
for (const f of requiredFiles) {
  if (!fs.existsSync(f)) {
    console.error(`   ❌ ${path.basename(f)} manquant!`);
    ok = false;
  } else {
    console.log(`   ✅ ${path.basename(f)} présent`);
  }
}
if (!ok) {
  console.error('\n❌ Build tsy nahomby! Vérifiez les fichiers obligatoires.');
  process.exit(1);
}

console.log('\n' + '═'.repeat(80));
console.log('✅ BUILD COMPLET TERMINÉ');
console.log(`📁 Sortie: ${distDir}`);
console.log('═'.repeat(80));