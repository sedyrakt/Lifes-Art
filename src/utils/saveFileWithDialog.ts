export interface SaveFileResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  size?: number;
  error?: string;
}

export async function saveFileWithDialog(
  data: ArrayBuffer | Uint8Array | string,
  defaultFileName: string,
  filters: Array<{ name: string; extensions: string[] }> = []
): Promise<SaveFileResult> {
  console.log('💾 [saveFileWithDialog] START');
  console.log('   defaultFileName:', defaultFileName);
  console.log('   filters:', filters);
  console.log('   data type:', typeof data);
  console.log('   data instanceof ArrayBuffer:', data instanceof ArrayBuffer);
  console.log('   ArrayBuffer.isView:', ArrayBuffer.isView(data));

  try {
    // Validation
    if (data === undefined || data === null) {
      return { success: false, error: 'Aucune donnée à enregistrer.' };
    }

    if (typeof defaultFileName !== 'string' || !defaultFileName.trim()) {
      defaultFileName = 'document';
    }

    // Vérifie si l'API Electron est disponible
    if (!window.api?.utils?.saveFile) {
      console.error('❌ window.api.utils.saveFile indisponible');
      return { success: false, error: 'L\'API Electron "utils.saveFile" est indisponible.' };
    }

    // Normaliser les filtres
    const safeFilters = Array.isArray(filters) && filters.length
      ? filters.map(f => ({
          name: f.name,
          extensions: f.extensions.map(ext => ext.replace(/^\./, ''))
        }))
      : [{ name: 'Tous les fichiers', extensions: ['*'] }];

    console.log('📞 Calling window.api.utils.saveFile...');
    console.log('   args:', { data: data.constructor.name, defaultFileName, safeFilters });

    // Appel de l'API Electron
    const result = await window.api.utils.saveFile(data, defaultFileName, safeFilters);
    console.log('📥 Response from Electron:', result);

    if (!result) {
      return { success: false, error: 'Aucune réponse du processus Electron.' };
    }

    if (result.canceled) {
      console.log('ℹ️ Save dialog annulé');
      return { success: false, canceled: true };
    }

    if (!result.success) {
      console.error('❌ Save file failed:', result.error);
      return { success: false, error: result.error || 'Impossible d\'enregistrer le fichier.' };
    }

    console.log('✅ Fichier sauvegardé:', result.filePath);
    return { success: true, canceled: false, filePath: result.filePath, size: result.size };
  } catch (error: any) {
    console.error('❌ saveFileWithDialog Error:', error);
    return { success: false, canceled: false, error: error?.message || 'Erreur inattendue lors de la sauvegarde.' };
  }
}

export default saveFileWithDialog;