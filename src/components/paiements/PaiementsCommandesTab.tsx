import React, { useEffect, useMemo, useState } from 'react';
import { Search, CheckSquare, Square, Trash2, ShoppingCart, RotateCcw, TextSelection, Wallet, CreditCard, AlertCircle, Package, X } from 'lucide-react';
import { safeNumber, normalizeText, ITEMS_PER_PAGE, formatDate, DeleteType } from './PaiementsUtils';
import PaiementsPagination from './PaiementsPagination';
import EllipsisDropdown from './PaiementsDropdown';

interface Props { 
  isDark: boolean; 
  commandes: any[]; 
  onView: (data: any) => void; 
  onEdit: (data: any) => void; 
  onDelete: (id: number, type: string) => void; 
  onBulkDelete: (type: DeleteType) => void; 
}

const parseProducts = (produits?: string): { nom: string; quantite: number }[] => {
  if (!produits?.trim()) return [];
  return produits.split(',').map((item) => item.trim()).filter(Boolean).map((item) => {
    const match = item.match(/^(.*?)\s*\(x(\d+)\)\s*$/);
    if (!match) return { nom: item, quantite: 1 };
    return { nom: match[1].trim(), quantite: Number(match[2]) || 1 };
  });
};

const getStatusClass = (status: string, isDark: boolean) => {
  if (status.toLowerCase() === 'payé' || status.toLowerCase() === 'paye') {
    return 'bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/25';
  }
  if (status.toLowerCase() === 'partiel') {
    return 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-300 dark:border-warning-500/25';
  }
  return 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-500/10 dark:text-danger-400 dark:border-danger-500/25';
};

const PaiementsCommandesTab: React.FC<Props> = ({ isDark, commandes = [], onView, onEdit, onDelete, onBulkDelete }) => {
  const [searchCommande, setSearchCommande] = useState('');
  const [commandePage, setCommandePage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [openedDropdownRow, setOpenedDropdownRow] = useState<number | null>(null);

  const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : '#E2E8F0';
  const cellBorderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0';
  const headerBorderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : '#E2E8F0';
  
  const tableBackground = isDark ? '#2A2A2A' : '#FFFFFF';
  const tableSecondaryBackground = isDark ? '#333333' : '#F8FAFC';
  const textColor = isDark ? '#FDE2E4' : '#264653';
  const mutedText = isDark ? '#B0B0B0' : '#64748B';
  const inputBg = isDark ? '#2A2A2A' : '#FFFFFF';

  const normalizedCommandes = useMemo(() => { 
    if (!Array.isArray(commandes)) return []; 
    return commandes.filter((commande) => commande && (commande.id !== undefined || commande.numero !== undefined)); 
  }, [commandes]);
  
  const filteredCommandes = useMemo(() => { 
    const term = normalizeText(searchCommande); 
    if (!term) return normalizedCommandes; 
    return normalizedCommandes.filter((commande) => { 
      const clientName = normalizeText(commande.client_nom ?? commande.client ?? ''); 
      const status = normalizeText(commande.statut_paiement ?? commande.statut ?? ''); 
      const numero = normalizeText(commande.numero ?? ''); 
      const id = String(commande.id ?? ''); 
      const products = parseProducts(commande.produits_noms); 
      const designation = products.map(p => p.nom).join(' '); 
      return clientName.includes(term) || status.includes(term) || numero.includes(term) || id.includes(term) || normalizeText(designation).includes(term); 
    }); 
  }, [normalizedCommandes, searchCommande]);
  
  useEffect(() => { setCommandePage(1); }, [searchCommande]);
  
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredCommandes.length / ITEMS_PER_PAGE)), [filteredCommandes.length]);
  
  useEffect(() => { 
    if (commandePage > totalPages) setCommandePage(totalPages); 
  }, [commandePage, totalPages]);
  
  const displayedCommandes = useMemo(() => { 
    const start = (commandePage - 1) * ITEMS_PER_PAGE; 
    return filteredCommandes.slice(start, start + ITEMS_PER_PAGE); 
  }, [filteredCommandes, commandePage]);

  const handleSelectOne = (id: number, checked: boolean) => { 
    if (!id) return; 
    setSelectedIds((prev) => { 
      const next = new Set(prev); 
      checked ? next.add(id) : next.delete(id); 
      return next; 
    }); 
  };
  
  const filteredIds = useMemo(() => filteredCommandes.map(item => Number(item?.id)).filter(id => Number.isFinite(id) && id > 0), [filteredCommandes]);
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));
  const someSelected = filteredIds.some(id => selectedIds.has(id));
  
  const handleSelectAll = (checked: boolean) => { 
    if (!checked) { setSelectedIds(new Set()); return; } 
    setSelectedIds(new Set(filteredIds)); 
  };
  
  const clearSelection = () => setSelectedIds(new Set());
  
  const handleBulkDelete = () => { 
    if (selectedIds.size === 0) return; 
    onBulkDelete('commande'); 
    setSelectedIds(new Set()); 
  };
  
  const handleResetSearch = () => { 
    setSearchCommande(''); 
    setCommandePage(1); 
    setSelectedIds(new Set()); 
  };

  const stats = useMemo(() => {
    const total = filteredCommandes.length;
    const totalMontant = filteredCommandes.reduce((sum, c) => sum + safeNumber(c?.total_ttc ?? c?.total ?? 0), 0);
    const totalQuantite = filteredCommandes.reduce((sum, c) => {
      const products = parseProducts(c?.produits_noms);
      return sum + products.reduce((s, p) => s + p.quantite, 0);
    }, 0);
    
    const statusStats: Record<string, number> = {};
    for (const c of filteredCommandes) {
      const status = c?.statut_paiement || 'Non payé';
      if (!statusStats[status]) statusStats[status] = 0;
      statusStats[status]++;
    }
    const topStatuses = Object.entries(statusStats).sort(([, a], [, b]) => b - a).slice(0, 3);
    
    return { total, totalMontant, totalQuantite, topStatuses };
  }, [filteredCommandes]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4 shadow-sm" style={{ background: tableBackground, borderColor: borderColor }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold" style={{ color: textColor }}>Liste des commandes</h2>
              <p className="mt-0.5 text-[13px]" style={{ color: mutedText }}>{filteredCommandes.length} commande{filteredCommandes.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
              <input 
                type="text" 
                value={searchCommande} 
                onChange={(e) => setSearchCommande(e.target.value)} 
                placeholder="Rechercher..."
                className="h-10 w-[450px] rounded-lg border pl-9 pr-9 text-[13px] outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                style={{ background: inputBg, borderColor: borderColor, color: textColor }} 
              />
              {searchCommande && (
                <button type="button" onClick={handleResetSearch} className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-brand-50" style={{ color: mutedText }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5" style={{ borderColor: borderColor, background: isDark ? 'rgba(13,128,210,0.02)' : '#F0F7FD' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm">
              <CheckSquare size={15} />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold text-brand-600 dark:text-brand-400">
                {selectedIds.size} commande{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
              </span>
              <span className="mt-0.5 text-[12px] text-brand-500/80 dark:text-brand-400/80">Action groupée disponible</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={handleBulkDelete} 
              className="inline-flex items-center gap-2 rounded-lg bg-danger-500 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-danger-600 hover:shadow-md active:scale-[0.98]"
            >
              <Trash2 size={15} /> Supprimer
            </button>
            <button 
              type="button" 
              onClick={clearSelection} 
              className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-all hover:bg-gray-50"
              style={{ borderColor: borderColor, background: inputBg, color: mutedText }} 
            >
              <TextSelection size={15} /> Désélectionner
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border shadow-sm" style={{ background: tableBackground, borderColor: borderColor }}>
        <div className="custom-scrollbar overflow-x-auto overflow-y-auto scrollbar-gutter-stable">
          <table className="w-full min-w-[920px] table-fixed border-collapse text-left">
            <thead className="sticky top-0 z-20 backdrop-blur-xl" style={{ background: isDark ? 'rgba(42,42,42,0.97)' : 'rgba(248,250,252,0.97)' }}>
              <tr className="text-[12px] font-semibold uppercase tracking-[0.055em] text-slate-500 dark:text-slate-400">
                <th className={`w-[48px] border px-3 py-4 align-middle`} style={{ borderColor: headerBorderColor }}>
                  <button type="button" onClick={() => handleSelectAll(!allSelected)} className="flex items-center justify-center text-slate-400 transition-colors hover:text-brand-500" aria-label={allSelected ? 'Désélectionner tout' : 'Sélectionner tout'}>
                    {allSelected ? <CheckSquare size={17} className="text-brand-500" /> : <Square size={17} className={someSelected ? 'text-brand-500' : ''} />}
                  </button>
                </th>
                <th className={`w-[140px] border px-3 py-4`} style={{ borderColor: headerBorderColor }}>N° CMD</th>
                <th className={`w-[220px] border px-3 py-4`} style={{ borderColor: headerBorderColor }}>PRODUITS</th>
                <th className={`w-[190px] border px-3 py-4`} style={{ borderColor: headerBorderColor }}>CLIENT</th>
                <th className={`w-[140px] border px-3 py-4`} style={{ borderColor: headerBorderColor }}>TOTAL</th>
                <th className={`w-[150px] border px-3 py-4`} style={{ borderColor: headerBorderColor }}>STATUT</th>
                <th className={`w-[90px] border px-3 py-4 text-right`} style={{ borderColor: headerBorderColor }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {displayedCommandes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border px-6 py-14 text-center" style={{ borderColor: cellBorderColor }}>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                      <ShoppingCart size={22} className="text-brand-500" />
                    </div>
                    <p className="mt-3 text-[14px] font-medium" style={{ color: textColor }}>Aucune commande trouvée</p>
                    <p className="mt-1 text-[13px]" style={{ color: mutedText }}>{searchCommande ? 'Essayez une autre recherche.' : 'Aucune commande disponible.'}</p>
                    {searchCommande && (
                      <button type="button" onClick={handleResetSearch} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-brand-600">
                        <RotateCcw size={14} />Réinitialiser
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                displayedCommandes.map((commande, idx) => { 
                  const products = parseProducts(commande.produits_noms);
                  const first = products.length > 0 ? products[0] : null;
                  const designation = first ? first.nom : (products.length > 0 ? `${products.length} produits` : '-');
                  const commandeId = Number(commande?.id);
                  const selected = selectedIds.has(commandeId);
                  const numero = commande?.numero ?? commande?.id ?? '0';
                  const client = commande?.client_nom || commande?.client || 'Inconnu';
                  const total = safeNumber(commande?.total_ttc ?? commande?.total ?? 0);
                  const status = commande?.statut_paiement || 'Non payé';
                  
                  return (
                    <tr key={commandeId || `commande-${idx}`} className={`group h-[64px] transition-all duration-150 ${selected ? 'bg-brand-50/50 dark:bg-brand-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'}`}>
                      <td className={`border px-3 py-3 align-middle`} style={{ borderColor: cellBorderColor }} onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => handleSelectOne(commandeId, !selected)} className="flex items-center justify-center transition-colors hover:text-brand-500" aria-label={selected ? 'Désélectionner' : 'Sélectionner'}>
                          {selected ? <CheckSquare size={17} className="text-brand-500" /> : <Square size={17} />}
                        </button>
                      </td>
                      <td className={`border px-3 py-3 align-middle`} style={{ borderColor: cellBorderColor }}>
                        <span className="font-mono text-[14px] font-semibold" style={{ color: textColor }}>#{String(numero).padStart(4, '0')}</span>
                      </td>
                      <td className={`border px-3 py-3 align-middle`} style={{ borderColor: cellBorderColor }}>
                        <div className="min-w-0">
                          <span className="block max-w-[200px] truncate text-[14px] font-semibold" style={{ color: textColor }} title={String(designation)}>{designation}</span>
                          {products.length > 1 && (
                            <span className="mt-0.5 block text-[11px]" style={{ color: mutedText }}>+{products.length - 1} autre{products.length - 1 > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </td>
                      <td className={`border px-3 py-3 align-middle`} style={{ borderColor: cellBorderColor }}>
                        <span className="block max-w-[170px] truncate text-[14px]" style={{ color: textColor }} title={String(client)}>{client}</span>
                      </td>
                      <td className={`border px-3 py-3 align-middle`} style={{ borderColor: cellBorderColor }}>
                        <span className="whitespace-nowrap text-[14px] font-bold text-brand-600 dark:text-brand-400">{`${Number(total).toLocaleString('fr-FR')} Ar`}</span>
                      </td>
                      <td className={`border px-3 py-3 align-middle`} style={{ borderColor: cellBorderColor }}>
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold uppercase ${getStatusClass(status, isDark)}`}>{status}</span>
                      </td>
                      <td className={`border px-3 py-3 align-middle text-right`} style={{ borderColor: cellBorderColor }} onClick={(e) => e.stopPropagation()}>
                        <EllipsisDropdown id={commandeId} type="commande" data={commande} isDark={isDark} onView={onView} onEdit={onEdit} onDelete={onDelete} onOpenChange={(open) => setOpenedDropdownRow(open ? commandeId : null)} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t px-5 py-3.5" style={{ borderColor: borderColor, background: tableSecondaryBackground }}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium" style={{ color: mutedText }}>
            <span className="flex items-center gap-2">
              <ShoppingCart size={14} className="text-brand-500" />
              <span><span className="font-semibold" style={{ color: textColor }}>{stats.total}</span> cmd{stats.total > 1 ? 's' : ''}</span>
            </span>
            <span className="flex items-center gap-2">
              <Wallet size={14} className="text-brand-500" />
              <span><span className="font-semibold" style={{ color: textColor }}>{Number(stats.totalMontant).toLocaleString('fr-FR')} Ar</span> Total</span>
            </span>
            <span className="flex items-center gap-2">
              <Package size={14} className="text-brand-500" />
              <span><span className="font-semibold" style={{ color: textColor }}>{stats.totalQuantite}</span> prod{stats.totalQuantite > 1 ? 's' : ''}</span>
            </span>

            <span className="hidden h-4 w-px bg-gray-300 sm:block dark:bg-white/[0.12]" />

            <div className="flex flex-wrap items-center gap-1.5">
              {stats.topStatuses.map(([status, count]) => (
                <span key={status} className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[13px] font-medium"
                  style={{ borderColor: borderColor, background: inputBg, color: textColor }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  <span className="max-w-[100px] truncate">{status}</span>
                  <span className="opacity-70">{count}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[13px] font-medium" style={{ color: mutedText }}>
            <AlertCircle size={14} />
            <span>Suivi</span>
          </div>
        </div>

        {filteredCommandes.length > 0 && (
          <div className="border-t" style={{ borderColor: borderColor }}>
            <PaiementsPagination currentPage={commandePage} totalPages={totalPages} totalItems={filteredCommandes.length} onPageChange={setCommandePage} />
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
        @keyframes commandeRowIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
        .group { animation: commandeRowIn .18s ease-out; }
      `}</style>
    </div>
  );
};

export default PaiementsCommandesTab;