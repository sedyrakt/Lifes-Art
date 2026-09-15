// src/components/dashboard/hooks/useDashboardAlerts.ts
import { useMemo } from 'react';
import { formatNumber, formatAriary, formatRelativeTime } from '../utils/formatters';
import type { AlertItem } from '../types';

interface Params {
  ruptureStock: number;
  commandesNonPayees: number;
  detteClient: number;
  clientsActifs: number;
  alertesStock: number;
  ruptureStockDetails: any[];
  detteClientsDetails: any[];
  commandesEnAttenteDetails: any[];
}

export const useDashboardAlerts = (params: Params): AlertItem[] => {
  const {
    ruptureStock, commandesNonPayees, detteClient, clientsActifs, alertesStock,
    ruptureStockDetails, detteClientsDetails, commandesEnAttenteDetails,
  } = params;

  return useMemo(() => {
    const list: AlertItem[] = [];

    if (ruptureStock > 0) {
      const noms: string[] = ruptureStockDetails.slice(0, 2).map((p: any) => String(p?.nom || '').trim()).filter(Boolean);
      const restant = Math.max(0, ruptureStock - noms.length);
      const nomsLabel = noms.length > 0
        ? `${noms.join(', ')}${restant > 0 ? ` +${restant} autre(s)` : ''}`
        : `${formatNumber(ruptureStock)} produit(s)`;
      const lastDate = ruptureStockDetails[0]?.date_ref;
      list.push({
        type: 'Rupture de stock',
        title: 'Rupture de stock',
        message: `${nomsLabel} — rupture totale`,
        time: formatRelativeTime(lastDate),
      });
    }

    if (commandesNonPayees > 0) {
      const nb = commandesEnAttenteDetails.length || commandesNonPayees;
      const dates = commandesEnAttenteDetails
        .map((c: any) => c?.date_ref)
        .filter(Boolean)
        .sort((a: string, b: string) => String(b).localeCompare(String(a)));
      const lastDate = dates[0];
      const exemple = commandesEnAttenteDetails[0]?.numero ? ` (${commandesEnAttenteDetails[0].numero})` : '';
      list.push({
        type: 'Commande en attente',
        title: 'Commande en attente',
        message: `${formatNumber(nb)} commande(s) en attente de validation${exemple}`,
        time: formatRelativeTime(lastDate),
      });
    }

    if (detteClient > 0) {
      const parClient = new Map<string, { total: number; derniereDate: string | null }>();
      for (const c of detteClientsDetails) {
        const nom = String(c?.client_nom || 'Client inconnu').trim();
        const dette = Number(c?.dette ?? 0);
        const date = c?.date_ref ? String(c.date_ref) : null;
        const prev = parClient.get(nom);
        if (prev) {
          prev.total += dette;
          if (date && (!prev.derniereDate || date > prev.derniereDate)) prev.derniereDate = date;
        } else {
          parClient.set(nom, { total: dette, derniereDate: date });
        }
      }
      const arr = Array.from(parClient.entries()).sort((a, b) => b[1].total - a[1].total);
      const top = arr.slice(0, 2).map(([nom, info]) => `${nom} : ${formatAriary(info.total)}`);
      const restant = Math.max(0, arr.length - top.length);
      const label = top.length > 0
        ? `${top.join(' · ')}${restant > 0 ? ` +${restant} autre(s)` : ''}`
        : `Encours client : ${formatAriary(detteClient)}`;
      const dates = arr.map(([, info]) => info.derniereDate).filter(Boolean) as string[];
      const lastDate = dates.sort((a, b) => String(b).localeCompare(String(a)))[0];
      list.push({
        type: 'Paiement reçu',
        title: 'Paiement reçu',
        message: label,
        time: formatRelativeTime(lastDate),
      });
    }

    if (clientsActifs > 0) {
      list.push({
        type: 'ok',
        title: 'Nouveau client',
        message: `${formatNumber(clientsActifs)} client(s) actif(s) sur la période`,
        time: 'Période actuelle',
      });
    }

    if (alertesStock > 0) {
      list.push({
        type: 'Stock faible',
        title: 'Stock faible',
        message: `${formatNumber(alertesStock)} produit(s) — Seuil minimum atteint`,
        time: 'Période actuelle',
      });
    }

    if (list.length === 0) {
      list.push({
        type: 'ok',
        title: 'Système opérationnel',
        message: 'Aucune alerte pour la période sélectionnée',
        time: 'À l\'instant',
      });
    }

    return list.slice(0, 5);
  }, [alertesStock, ruptureStock, commandesNonPayees, detteClient, clientsActifs,
      ruptureStockDetails, detteClientsDetails, commandesEnAttenteDetails]);
};