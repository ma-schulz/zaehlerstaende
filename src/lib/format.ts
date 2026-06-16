const numberCache = new Map<number, Intl.NumberFormat>();

/** Zahl mit fester Anzahl Nachkommastellen im de-DE-Format (Komma als Dezimaltrenner). */
export function formatNumber(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return '–';
  let fmt = numberCache.get(decimals);
  if (!fmt) {
    fmt = new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    numberCache.set(decimals, fmt);
  }
  return fmt.format(value);
}

const currencyFmt = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

/** Geldbetrag im de-DE-Format, z.B. "0,35 €". */
export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '–';
  return currencyFmt.format(value);
}

/** Wert mit angehängter Einheit, z.B. "1.234,5 kWh". */
export function formatWithUnit(value: number, decimals: number, unit: string): string {
  return `${formatNumber(value, decimals)} ${unit}`;
}

import type { MeterKind } from '../types';

/** Bezeichnungen je nach Zählerart (Verbrauch/Kosten, Einspeisung/Ertrag oder reine Info). */
export function meterTerms(kind: MeterKind) {
  switch (kind) {
    case 'feed_in':
      return { amount: 'Einspeisung', money: 'Ertrag', rate: 'Vergütung', hasMoney: true };
    case 'info':
      return { amount: 'Verbrauch', money: '', rate: '', hasMoney: false };
    default:
      return { amount: 'Verbrauch', money: 'Kosten', rate: 'Kosten', hasMoney: true };
  }
}
