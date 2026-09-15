// src/components/commandes/CommandesModalForm/ClientSelector.tsx
// ⭐ FONT SIZE: +0.5px (search 13px, items 13px, contact 11.5px)

import React, { useMemo, useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { COLORS, Client } from './CommandesModalConstants';

interface ClientSelectorProps {
  clients: Client[];
  selectedClientId: number | null;
  onClientChange: (id: number | null) => void;
  inputClass: string;
  inputStyle: React.CSSProperties;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients, selectedClientId, onClientChange, inputClass, inputStyle,
}) => {
  const { isDark } = useTheme();
  const theme = isDark ? COLORS.dark : COLORS.light;

  const [clientSearch, setClientSearch] = useState('');
  const [clientOpen, setClientOpen] = useState(false);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients.slice(0, 50);
    const q = clientSearch.toLowerCase();
    return clients.filter(c =>
      c.nom?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.telephone?.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [clients, clientSearch]);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setClientOpen(!clientOpen)}
        className={`${inputClass} flex items-center justify-between text-left cursor-pointer`}
        style={inputStyle}
      >
        <span className="truncate">
          {selectedClient ? selectedClient.nom : 'Sélectionner un client'}
        </span>
        {/* ⭐ Chevron : 15 → 16 */}
        <ChevronDown
          size={16}
          className={`ml-2 shrink-0 transition-transform ${clientOpen ? 'rotate-180' : ''}`}
          style={{ color: theme.muted }}
        />
      </button>

      {clientOpen && (
        <div
          className="absolute left-0 right-0 z-[999] mt-1.5 max-h-56 overflow-y-auto rounded-lg border shadow-xl"
          style={{ borderColor: theme.border, background: theme.card }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="p-2 border-b sticky top-0" style={{ borderColor: theme.border, background: theme.card }}>
            <div className="relative">
              {/* ⭐ Search icon : 13 → 14 */}
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: theme.muted }} />
              {/* ⭐ Search input : h-8 → h-9, text-[12.5px] → text-[13px], pl-8 → pl-9 */}
              <input
                autoFocus
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full h-9 rounded-md pl-9 pr-3 text-[13px] outline-none border"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="py-0.5">
            {filteredClients.length === 0 ? (
              /* ⭐ Empty : 12.5px → 13px */
              <div className="px-4 py-3 text-[13px]" style={{ color: theme.muted }}>
                Aucun client trouvé
              </div>
            ) : (
              filteredClients.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onClientChange(c.id);
                    setClientOpen(false);
                    setClientSearch('');
                  }}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/5"
                  style={{ color: theme.text }}
                >
                  <div className="min-w-0 flex-1">
                    {/* ⭐ Name : 12.5px → 13px */}
                    <p className="text-[13px] font-semibold truncate">{c.nom}</p>
                    {/* ⭐ Contact : 11px → 11.5px */}
                    <p className="text-[11.5px] truncate" style={{ color: theme.muted }}>
                      {c.telephone} · {c.email}
                    </p>
                  </div>
                  {/* ⭐ Check : 14 → 15 */}
                  {c.id === selectedClientId && <Check size={15} style={{ color: theme.primary }} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};