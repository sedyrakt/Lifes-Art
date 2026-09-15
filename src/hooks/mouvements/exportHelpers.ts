// src/hooks/mouvements/exportHelpers.ts

export type ExportPeriod = 'aujourdhui' | 'hier' | 'semaine' | 'mois' | 'annee' | 'custom';

export const getExportPeriodRange = (exportPeriod: ExportPeriod, customDate: string) => {
  const now = new Date();
  let startDate: string | undefined, endDate: string | undefined;

  if (exportPeriod === 'aujourdhui') {
    startDate = now.toISOString().split('T')[0] + ' 00:00:00';
    endDate = now.toISOString().split('T')[0] + ' 23:59:59';
  } else if (exportPeriod === 'hier') {
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    startDate = yest.toISOString().split('T')[0] + ' 00:00:00';
    endDate = yest.toISOString().split('T')[0] + ' 23:59:59';
  } else if (exportPeriod === 'semaine') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    startDate = monday.toISOString().split('T')[0] + ' 00:00:00';
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    endDate = sunday.toISOString().split('T')[0] + ' 23:59:59';
  } else if (exportPeriod === 'mois') {
    startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01 00:00:00`;
    endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')} 23:59:59`;
  } else if (exportPeriod === 'annee') {
    startDate = `${now.getFullYear()}-01-01 00:00:00`;
    endDate = `${now.getFullYear()}-12-31 23:59:59`;
  } else if (exportPeriod === 'custom') {
    const dateStr = customDate || now.toISOString().split('T')[0];
    startDate = dateStr + ' 00:00:00';
    endDate = dateStr + ' 23:59:59';
  }
  return { startDate, endDate };
};