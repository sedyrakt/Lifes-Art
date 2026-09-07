import React, { useEffect, useMemo, useState } from 'react';
import { Search, CheckSquare, Square, Trash2, Plus, TextSelection, FileText } from 'lucide-react';
import { safeNumber, normalizeText, ITEMS_PER_PAGE, formatDate, getStatusClass, DeleteType } from './PaiementsUtils';
import PaiementsPagination from './PaiementsPagination';
import EllipsisDropdown from './PaiementsDropdown';

interface Props { 
  isDark: boolean; 
  factures: any[]; 
  commandes?: any[]; 
  onView: (data: any) => void; 
  onEdit: (data: any) => void; 
  onDelete: (id: number, type: string) => void; 
  onBulkDelete: (type: DeleteType) => void; 
  onAdd?: () => void; 
}

const PaiementsFacturesTab: React.FC<Props> = ({ 
  isDark, 
  factures = [], 
  commandes = [], 
  onView, 
  onEdit, 
  onDelete, 
  onBulkDelete, 
  onAdd 
}) => {
  const [searchFacture, setSearchFacture] = useState('');
  const [facturePage, setFacturePage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const borderColor = isDark ? 'rgba(255,255,255,0.15)' : '#E2E8F0';
  const cellBorderColor = isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0';
  const headerBorderColor = isDark ? 'rgba(255,255,255,0.15)' : '#E2E8F0';
  
  const tableBackground = isDark ? '#2A2A2A' : '#FFFFFF';
  const tableSecondaryBackground = isDark ? '#333333' : '#F8FAFC';
  const textColor = isDark ? '#FDE2E4' : '#264653';
  const mutedText = isDark ? '#B0B0B0' : '#64748B';
  const inputBg = isDark ? '#2A2A2A' : '#FFFFFF';

  const mergedItems = useMemo(() => {
    const safeCommandes = Array.isArray(commandes) ? commandes : [];
    const safeFactures = Array.isArray(factures) ? factures : [];
    const commandesMapped = safeCommandes.map(c => ({ ...c, _type: 'commande' }));
    const facturesMapped = safeFactures.map(f => ({ ...f, _type: 'facture' }));
    return [...commandesMapped, ...facturesMapped].filter(Boolean);
  }, [commandes, factures]);

  const filteredItems = useMemo(() => { 
    const term = normalizeText(searchFacture); 
    if (!term) return mergedItems; 
    return mergedItems.filter((item) => { 
      const numero = normalizeText(item?.numero ?? item?.reference ?? item?.facture_numero ?? item?.id ?? ''); 
      const client = normalizeText(item?.client_nom ?? item?.client ?? item?.client_name ?? ''); 
      const statut = normalizeText(item?.statut_paiement ?? item?.statut ?? ''); 
      return numero.includes(term) || client.includes(term) || statut.includes(term); 
    }); 
  }, [mergedItems, searchFacture]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const displayedItems = useMemo(() => { 
    const start = (facturePage - 1) * ITEMS_PER_PAGE; 
    return filteredItems.slice(start, start + ITEMS_PER_PAGE); 
  }, [filteredItems, facturePage]);

  useEffect(() => { setFacturePage(1); }, [searchFacture]);
  useEffect(() => { if (facturePage > totalPages) setFacturePage(totalPages); }, [facturePage, totalPages]);

  const filteredIds = useMemo(() => filteredItems.map((item) => Number(item?.id)).filter((id) => Number.isFinite(id) && id > 0), [filteredItems]);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));
  const someFilteredSelected = filteredIds.some(id => selectedIds.has(id));

  const handleSelectOne = (id: number, checked: boolean) => { 
    if (!Number.isFinite(id) || id <= 0) return; 
    setSelectedIds((previous) => { 
      const next = new Set(previous); 
      if (checked) next.add(id); else next.delete(id); 
      return next; 
    }); 
  };
  
  const handleSelectAll = (checked: boolean) => { 
    setSelectedIds((previous) => { 
      const next = new Set(previous); 
      if (checked) filteredIds.forEach((id) => next.add(id)); else filteredIds.forEach((id) => next.delete(id)); 
      return next; 
    }); 
  };
  
  const handleBulkDelete = () => { 
    if (selectedIds.size === 0) return; 
    onBulkDelete('facture'); 
  };

  const stats = useMemo(() => {
    const total = filteredItems.length;
    const totalMontant = filteredItems.reduce((sum, f) => sum + safeNumber(f?.total_ttc ?? f?.total ?? f?.montant ?? 0), 0);
    const payees = filteredItems.filter(f => (f?.statut_paiement ?? 'Non payé') === 'Payé').length;
    const partiels = filteredItems.filter(f => (f?.statut_paiement ?? '') === 'Partiel').length;
    const nonPayes = filteredItems.filter(f => (f?.statut_paiement ?? 'Non payé') === 'Non payé').length;
    return { total, totalMontant, payees, partiels, nonPayes };
  }, [filteredItems]);

  if (mergedItems.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border p-4 shadow-sm" style={{ background: tableBackground, borderColor: borderColor }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-[15px] font-semibold" style={{ color: textColor }}>Gestion des factures</h2>
                <p className="mt-0.5 text-[13px]" style={{ color: mutedText }}>0 document</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border p-12 text-center shadow-sm" style={{ background: tableBackground, borderColor: borderColor }}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
            <FileText size={30} strokeWidth={1.8} className="text-brand-500" />
          </div>
          <h3 className="text-[16px] font-semibold" style={{ color: textColor }}>Aucune facture</h3>
          <p className="mx-auto mt-1 max-w-md text-[14px]" style={{ color: mutedText }}>Aucun document n'est disponible.</p>
          {onAdd && (
            <button type="button" onClick={onAdd} className="mx-auto mt-6 flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow focus:outline-none focus:ring-2 focus:ring-brand-500/30">
              <Plus size={16} />Ajouter une facture
            </button>
          )}
        </div>
      </div>
    );
  }

  if (mergedItems.length > 0 && filteredItems.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border p-4 shadow-sm" style={{ background: tableBackground, borderColor: borderColor }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                <FileText size={19} className="text-brand-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold" style={{ color: textColor }}>Gestion des factures</h2>
                <p className="mt-0.5 text-[13px]" style={{ color: mutedText }}>{mergedItems.length} document{mergedItems.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
              <input type="text" value={searchFacture} onChange={(e) => setSearchFacture(e.target.value)} placeholder="Rechercher..."  
                className="h-10 w-[500px] rounded-lg border pl-9 pr-3 text-[13px] outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                style={{ background: inputBg, borderColor: borderColor, color: textColor }} />
            </div>
          </div>
        </div>
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border px-6 py-14 text-center shadow-sm" style={{ background: tableBackground, borderColor: borderColor }}>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
            <Search size={22} className="text-brand-500" />
          </div>
          <h3 className="text-[16px] font-semibold" style={{ color: textColor }}>Aucune facture trouvée</h3>
          <p className="mt-1 max-w-md text-[14px]" style={{ color: mutedText }}>Aucun document ne correspond aux critères de recherche.</p>
          <button type="button" onClick={() => setSearchFacture('')} className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-brand-600">
            Réinitialiser la recherche
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4 shadow-sm" style={{ background: tableBackground, borderColor: borderColor }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
              <FileText size={19} className="text-brand-500" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold" style={{ color: textColor }}>Gestion des factures</h2>
              <p className="mt-0.5 text-[13px]" style={{ color: mutedText }}>{filteredItems.length} document{filteredItems.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
            <input type="text" value={searchFacture} onChange={(e) => setSearchFacture(e.target.value)} placeholder="Rechercher..." 
              className="h-10 w-[500px] rounded-lg border pl-9 pr-3 text-[13px] outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              style={{ background: inputBg, borderColor: borderColor, color: textColor }} />
          </div>
        </div>
      </div>


      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5" 
          style={{ borderColor: borderColor, background: isDark ? 'rgba(13,128,210,0.02)' : '#F0F7FD' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm">
              <CheckSquare size={15} />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold text-brand-600 dark:text-brand-400">
                {selectedIds.size} document{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
              </span>
              <span className="mt-0.5 text-[12px] text-brand-500/80 dark:text-brand-400/80">Action groupée disponible</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleBulkDelete} className="inline-flex items-center gap-2 rounded-lg bg-danger-500 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-danger-600 hover:shadow-md active:scale-[0.98]">
              <Trash2 size={15} />Supprimer
            </button>
            <button type="button" onClick={() => setSelectedIds(new Set())} 
              className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-all hover:bg-gray-50"
              style={{ borderColor: borderColor, background: inputBg, color: mutedText }}>
              <TextSelection size={15} />Désélectionner
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border shadow-sm" style={{ background: tableBackground, borderColor: borderColor }}>
        <div className="custom-scrollbar overflow-x-auto overflow-y-auto scrollbar-gutter-stable">
          <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
            <thead className="sticky top-0 z-20 backdrop-blur-xl" 
              style={{ background: isDark ? 'rgba(42,42,42,0.97)' : 'rgba(248,250,252,0.97)' }}>
              <tr className="text-[12px] font-semibold uppercase tracking-[0.055em] text-slate-500 dark:text-slate-400">
                <th className="w-[48px] border px-3 py-4 align-middle" style={{ borderColor: headerBorderColor }}>
                  <button type="button" onClick={() => handleSelectAll(!allFilteredSelected)} className="flex items-center justify-center text-slate-400 transition-colors hover:text-brand-500" aria-label={allFilteredSelected ? 'Désélectionner toutes' : 'Sélectionner toutes'}>
                    {allFilteredSelected ? <CheckSquare size={17} className="text-brand-500" /> : someFilteredSelected ? <CheckSquare size={17} className="text-brand-500" /> : <Square size={17} />}
                  </button>
                </th>
                <th className="w-[140px] border px-3 py-4" style={{ borderColor: headerBorderColor }}>N° DOC</th>
                <th className="w-[220px] border px-3 py-4" style={{ borderColor: headerBorderColor }}>CLIENT</th>
                <th className="w-[140px] border px-3 py-4" style={{ borderColor: headerBorderColor }}>MONTANT</th>
                <th className="w-[150px] border px-3 py-4" style={{ borderColor: headerBorderColor }}>STATUT</th>
                <th className="w-[90px] border px-3 py-4 text-right" style={{ borderColor: headerBorderColor }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {displayedItems.map((item, index) => {
                const itemId = Number(item?.id);
                const selected = selectedIds.has(itemId);
                const isCommande = item._type === 'commande';
                const numero = item?.numero ?? item?.reference ?? item?.facture_numero ?? `#${String(itemId || 0).padStart(4, '0')}`;
                const client = item?.client_nom ?? item?.client ?? item?.client_name ?? 'Inconnu';
                const montant = safeNumber(item?.total_ttc ?? item?.total ?? item?.montant ?? 0);
                const statut = item?.statut_paiement ?? 'Non payé';
                
                return (
                  <tr key={`${item._type}-${itemId || index}`} 
                    className={`group h-[64px] cursor-pointer transition-all duration-150 ${selected ? 'bg-brand-50/50 dark:bg-brand-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'}`} 
                    onClick={() => onView(item)}>
                    <td className="border px-3 py-3 align-middle" style={{ borderColor: cellBorderColor }} onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => handleSelectOne(itemId, !selected)} className="flex items-center justify-center text-slate-400 transition-colors hover:text-brand-500" aria-label={selected ? 'Désélectionner' : 'Sélectionner'}>
                        {selected ? <CheckSquare size={17} className="text-brand-500" /> : <Square size={17} />}
                      </button>
                    </td>
                    <td className="border px-3 py-3 align-middle" style={{ borderColor: cellBorderColor }}>
                      <span className="font-mono text-[14px] font-semibold" style={{ color: textColor }}>{numero}</span>
                    </td>
                    
                    <td className="border px-3 py-3 align-middle" style={{ borderColor: cellBorderColor }}>
                      <span className="block max-w-[200px] truncate text-[14.5px] font-medium transition-colors group-hover:text-brand-500" 
                        style={{ color: textColor }} title={String(client)}>{client}</span>
                    </td>
                    
                    <td className="border px-3 py-3 align-middle" style={{ borderColor: cellBorderColor }}>
                      <span className="whitespace-nowrap text-[14.5px] font-bold text-brand-600 dark:text-brand-400">{`${Number(montant).toLocaleString('fr-FR')} Ar`}</span>
                    </td>

                    <td className="border px-3 py-3 align-middle" style={{ borderColor: cellBorderColor }}>
                      <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold uppercase ${getStatusClass(statut, isDark)}`}>
                        {statut}
                      </span>
                    </td>
                    
                    <td className="border px-3 py-3 align-middle text-right" style={{ borderColor: cellBorderColor }} onClick={(e) => e.stopPropagation()}>
                      <EllipsisDropdown id={itemId} type={isCommande ? 'commande' : 'facture'} data={item} isDark={isDark} onView={onView} onEdit={onEdit} onDelete={onDelete} onOpenChange={() => {}} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t px-5 py-3.5" style={{ background: tableSecondaryBackground, borderColor: borderColor }}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium" style={{ color: mutedText }}>
            <span><span className="font-semibold" style={{ color: textColor }}>{stats.total}</span> doc{stats.total > 1 ? 's' : ''}</span>
            <span><span className="font-semibold" style={{ color: textColor }}>{Number(stats.totalMontant).toLocaleString('fr-FR')} Ar</span> Total</span>
            <span className="hidden h-4 w-px bg-gray-300 sm:block dark:bg-white/[0.12]" />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[13px] font-medium"
                style={{ borderColor: borderColor, background: inputBg, color: textColor }}>
                <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                <span className="max-w-[100px] truncate">Payé</span>
                <span className="opacity-70">{stats.payees}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[13px] font-medium"
                style={{ borderColor: borderColor, background: inputBg, color: textColor }}>
                <span className="h-1.5 w-1.5 rounded-full bg-warning-500" />
                <span className="max-w-[100px] truncate">Partiel</span>
                <span className="opacity-70">{stats.partiels}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[13px] font-medium"
                style={{ borderColor: borderColor, background: inputBg, color: textColor }}>
                <span className="h-1.5 w-1.5 rounded-full bg-danger-500" />
                <span className="max-w-[100px] truncate">Non payé</span>
                <span className="opacity-70">{stats.nonPayes}</span>
              </span>
            </div>
          </div>
          <div className="text-[13px] font-medium" style={{ color: mutedText }}>
            <span>Suivi</span>
          </div>
        </div>

        {filteredItems.length > 0 && (
          <div className="border-t" style={{ borderColor: borderColor }}>
            <PaiementsPagination currentPage={facturePage} totalPages={totalPages} totalItems={filteredItems.length} onPageChange={setFacturePage} />
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 7px; height: 7px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #0d80d2; border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0b6ab0; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #0d80d2 transparent; }
        .scrollbar-gutter-stable { scrollbar-gutter: stable; }
        @keyframes factureRowIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
        .group { animation: factureRowIn .18s ease-out; }
      `}</style>
    </div>
  );
};

export default PaiementsFacturesTab;