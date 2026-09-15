// src/hooks/produits/codeGenerator.ts

// ⭐ CODE FOHY SY SÉQUENTIEL (ohatra: "Confiture" → "CONF-XXX")
export const getCodePrefix = (nom: string = ''): string => {
  const clean = String(nom || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
  return clean.slice(0, 4).padEnd(3, 'X') || 'PRD';
};

export const generateShortCode = (nom: string = ''): string => {
  const prefix = getCodePrefix(nom);
  return `${prefix}-XXX`;
};