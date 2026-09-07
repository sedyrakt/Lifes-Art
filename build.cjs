// ============================================================
// build.cjs - PRODUCTION BUILD (OBFUSCATION ONLY)
// ⭐ TSY MISY BYTENODE INTSONY - Ampiasao ny .cjs obfusqué fotsiny
// ============================================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

console.log('═'.repeat(80));
console.log('🔒 BUILD COMPLET: OBFUSCATION ONLY (Bytenode esorina)');
console.log('═'.repeat(80));

const distDir = path.join(__dirname, 'dist-electron');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

// ============================================================
// ⭐ ÉTAPE 1: BYTENODE - ESORINA TANTERAKA (TSY MISY .jsc)
// ============================================================
// const bytenodeFiles = [...]; // ⏭️ ESORINA

// ============================================================
// 1. OBFUSCATION (main, preload, ipc, services, database, utils)
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
      // ⭐ FANOVANA: Skip ny .jsc (bytenode esorina)
      if (entry.name.endsWith('.jsc')) {
        console.log(`   ⏭️ Skipped (bytenode removed): ${path.relative(path.join(__dirname, 'electron'), srcPath)}`);
        continue;
      }
      if (entry.name.endsWith('.cjs')) {
        const success = obfuscateFile(srcPath, destPath, false);
        if (success) console.log(`   🔒 Obfusqué: ${path.relative(path.join(__dirname, 'electron'), srcPath)}`);
      } else {
        // .json, .pem, .db.enc, etc.
        fs.copyFileSync(srcPath, destPath);
        console.log(`   📄 Copié: ${path.relative(path.join(__dirname, 'electron'), srcPath)}`);
      }
    }
  }
}

console.log('\n📦 Obfuscation...');

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
// 2. COPIE DES RESSOURCES
// ============================================================
console.log('\n📦 Copie des ressources...');
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

// Assets, config, resources
const extraDirs = [
  { src: path.join(__dirname, 'electron/assets'), dest: path.join(distDir, 'assets') },
  { src: path.join(__dirname, 'electron/config'), dest: path.join(distDir, 'config') },
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
// 3. SUPPRESSION FICHIERS SENSIBLES
// ============================================================
console.log('\n🔒 Suppression des fichiers sensibles...');
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
// 4. GÉNÉRATION DES HASHES (INTEGRITY)
// ============================================================
console.log('\n📦 Génération des hashes d\'intégrité...');
try {
  execSync('node admin-tools/generate-integrity.cjs', { stdio: 'inherit' });
  console.log('   ✅ hashes.json + hashes.sig voaforona');
} catch (err) {
  console.error('   ❌ Erreur lors de la génération des hashes:', err.message);
  process.exit(1);
}

// ============================================================
// 5. FANADIOVANA FARANY (SAFETY NET: ESORINA NY .jsc Raha misy sisa)
// ============================================================
console.log('\n🧹 Fanadiovana farany (safe mode)...');
function cleanupJsc(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanupJsc(fullPath);
    } else if (entry.name.endsWith('.jsc')) {
      fs.unlinkSync(fullPath);
      console.log(`   🗑️ Nofafana: ${fullPath}`);
    }
  }
}
cleanupJsc(distDir);

// ============================================================
// 6. VÉRIFICATION FINALE
// ============================================================
console.log('\n🔍 Vérification finale...');
const requiredFiles = [
  path.join(distDir, 'keys/public.pem'),
  path.join(distDir, 'keys/codes.db.enc'),
  path.join(distDir, 'main.cjs'),
  path.join(distDir, 'generated/hashes.json'),
  path.join(distDir, 'generated/hashes.sig'),
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
console.log('✅ BUILD COMPLET TERMINÉ (OBFUSCATION ONLY)');
console.log(`📁 Sortie: ${distDir}`);
console.log('═'.repeat(80));