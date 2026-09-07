'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const { isPackaged, PUBLIC_KEY_PATHS } = require('./constants.cjs');

function getLicensePath() {
  if (!isPackaged) {
    return path.join(process.cwd(), 'license.lic');
  }
  if (process.platform === 'win32') {
    const programData = process.env.PROGRAMDATA || 'C:/ProgramData';
    return path.join(programData, 'FITAIA', 'license.lic');
  }
  return path.join(os.homedir(), '.fitaia', 'license.lic');
}

function canonicalizeJSON(obj) {
  if (Array.isArray(obj)) {
    return obj.map(canonicalizeJSON);
  }
  if (obj && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = canonicalizeJSON(obj[key]);
        return acc;
      }, {});
  }
  return obj;
}

// ⭐ FIX: Mifanaraka 100% amin'ny Generator - TSY misy isLifetime/isTest
function createCanonicalString(data) {
  const keys = Object.keys(data).filter(k => k !== 'signature').sort();
  const parts = keys.map(key => {
    const value = typeof data[key] === 'object' ? JSON.stringify(data[key]) : String(data[key]);
    return `${key}=${value}`;
  });
  const result = parts.join('&');

  if (process.env.DEBUG === 'true') {
    console.log(`🔧 [createCanonicalString] Keys: ${keys.join(', ')}`);
    console.log(`🔧 [createCanonicalString] Result: ${result}`);
  }

  return result;
}

function getPublicKeyHash() {
  try {
    const data = fs.readFileSync(PUBLIC_KEY_PATHS.find(p => fs.existsSync(p)) || PUBLIC_KEY_PATHS[0]);
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch (e) {
    return '';
  }
}

module.exports = {
  getLicensePath,
  canonicalizeJSON,
  createCanonicalString,
  getPublicKeyHash,
};