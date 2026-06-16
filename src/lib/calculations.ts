import type { Meter, Purchase, Reading } from '../types';

export interface Analysis {
  /** Anzahl der Messwerte insgesamt. */
  count: number;
  /** Erster Stand (Anfangsstand, wird nicht als Verbrauch gewertet). */
  firstValue: number | null;
  /** Aktueller (letzter) Stand. */
  lastValue: number | null;
  /** Gesamtverbrauch über den Zeitraum (letzter − erster). */
  totalConsumption: number;
  /** Zeitraum zwischen erstem und letztem Stand in Tagen (Bruchteile möglich). */
  days: number;
  /** Verbrauch heruntergerechnet auf einen Tag. */
  perDay: number;
  /** Voraussichtlicher Verbrauch pro Jahr (perDay × 365). */
  perYear: number;
  /** Kosten pro Tag. */
  costPerDay: number;
  /** Kosten pro Jahr. */
  costPerYear: number;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Readings aufsteigend nach Zeit sortiert zurückgeben (ohne das Original zu mutieren). */
export function sortReadings(readings: Reading[]): Reading[] {
  return [...readings].sort(
    (a, b) => new Date(a.reading_at).getTime() - new Date(b.reading_at).getTime(),
  );
}

/**
 * Auswertung für einen Zähler. Der erste Wert gilt als Anfangsstand und zählt
 * selbst nicht als Verbrauch — gerechnet wird die Differenz zum letzten Stand.
 */
export function analyze(readings: Reading[], costPerUnit: number): Analysis {
  const sorted = sortReadings(readings);
  const empty: Analysis = {
    count: sorted.length,
    firstValue: sorted[0]?.value ?? null,
    lastValue: sorted[sorted.length - 1]?.value ?? null,
    totalConsumption: 0,
    days: 0,
    perDay: 0,
    perYear: 0,
    costPerDay: 0,
    costPerYear: 0,
  };

  if (sorted.length < 2) return empty;

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalConsumption = last.value - first.value;
  const days =
    (new Date(last.reading_at).getTime() - new Date(first.reading_at).getTime()) / MS_PER_DAY;

  if (days <= 0) {
    return { ...empty, totalConsumption };
  }

  const perDay = totalConsumption / days;
  const perYear = perDay * 365;

  return {
    count: sorted.length,
    firstValue: first.value,
    lastValue: last.value,
    totalConsumption,
    days,
    perDay,
    perYear,
    costPerDay: perDay * costPerUnit,
    costPerYear: perYear * costPerUnit,
  };
}

export interface StockInfo {
  /** Summe aller Zukäufe (Menge). */
  totalPurchased: number;
  /** Verbrauchte Menge (aus den Ständen). */
  totalConsumed: number;
  /** Aktuell vorhandener Bestand: Zukäufe − Verbrauch. */
  stock: number;
  /** FIFO-Kosten der verbrauchten Menge. */
  fifoCost: number;
  /** Durchschnittspreis pro Einheit der bisher verbrauchten (verrechneten) Menge. */
  avgUnitPrice: number;
}

/**
 * Verteilt die verbrauchte Menge nach dem FIFO-Prinzip auf die Zukäufe:
 * der älteste Zukauf wird zuerst mit dem Verbrauch verrechnet, dann der nächste usw.
 * Jeder Zukauf bringt seinen eigenen Stückpreis (total_price / quantity) mit.
 */
export function fifoStock(purchases: Purchase[], totalConsumed: number): StockInfo {
  const sorted = [...purchases].sort(
    (a, b) => new Date(a.purchased_at).getTime() - new Date(b.purchased_at).getTime(),
  );
  const totalPurchased = sorted.reduce((sum, p) => sum + p.quantity, 0);

  let remaining = totalConsumed;
  let fifoCost = 0;
  let costedQty = 0;
  for (const lot of sorted) {
    if (remaining <= 0) break;
    const unitPrice = lot.quantity > 0 ? lot.total_price / lot.quantity : 0;
    const take = Math.min(remaining, lot.quantity);
    fifoCost += take * unitPrice;
    costedQty += take;
    remaining -= take;
  }

  return {
    totalPurchased,
    totalConsumed,
    stock: totalPurchased - totalConsumed,
    fifoCost,
    avgUnitPrice: costedQty > 0 ? fifoCost / costedQty : 0,
  };
}

export interface MeterAnalysis extends Analysis {
  /** Bestands-/FIFO-Infos für nicht leitungsgebundene Zähler, sonst null. */
  stockInfo: StockInfo | null;
}

/**
 * Vollständige Auswertung eines Zählers inkl. Kosten:
 * - leitungsgebunden: Kosten = Verbrauch × Tarif (cost_per_unit)
 * - nicht leitungsgebunden: Kosten per FIFO aus den Zukäufen, plus aktueller Bestand
 */
export function analyzeMeter(
  meter: Meter,
  readings: Reading[],
  purchases: Purchase[],
): MeterAnalysis {
  const base = analyze(readings, meter.cost_per_unit);

  // Nur nicht leitungsgebundene Verbrauchszähler nutzen Zukäufe/FIFO.
  if (meter.line_bound || meter.kind !== 'consumption') {
    return { ...base, stockInfo: null };
  }

  const stockInfo = fifoStock(purchases, base.totalConsumption);
  const costPerDay = base.days > 0 ? stockInfo.fifoCost / base.days : 0;
  return {
    ...base,
    costPerDay,
    costPerYear: costPerDay * 365,
    stockInfo,
  };
}

export interface UnitSummary {
  /** Einheit, über die summiert wird (z.B. "kWh"). */
  unit: string;
  /** Nachkommastellen zur Anzeige (vom ersten Zähler dieser Einheit). */
  decimals: number;
  /** Netto-Verbrauch pro Jahr: Summe Verbrauchszähler − Summe Einspeisezähler. */
  perYear: number;
  /** Netto-Kosten pro Jahr: Summe Kosten − Summe Erträge. */
  costPerYear: number;
  /** Anzahl beteiligter Zähler (Info-Zähler zählen nicht mit). */
  meterCount: number;
}

/**
 * Fasst alle Zähler je Einheit zusammen. Einspeisezähler (feed_in) werden vom
 * Verbrauch und von den Kosten abgezogen; Info-Zähler bleiben unberücksichtigt.
 */
export function summarizeByUnit(
  meters: Meter[],
  readingsByMeter: Map<string, Reading[]>,
  purchasesByMeter: Map<string, Purchase[]>,
): UnitSummary[] {
  const byUnit = new Map<string, UnitSummary>();

  for (const meter of meters) {
    if (meter.kind === 'info') continue;
    const a = analyzeMeter(
      meter,
      readingsByMeter.get(meter.id) ?? [],
      purchasesByMeter.get(meter.id) ?? [],
    );
    const sign = meter.kind === 'feed_in' ? -1 : 1;

    const entry =
      byUnit.get(meter.unit) ??
      { unit: meter.unit, decimals: meter.decimals, perYear: 0, costPerYear: 0, meterCount: 0 };
    entry.perYear += sign * a.perYear;
    entry.costPerYear += sign * a.costPerYear;
    entry.meterCount += 1;
    byUnit.set(meter.unit, entry);
  }

  return [...byUnit.values()].sort((a, b) => a.unit.localeCompare(b.unit));
}

export interface IntervalPoint {
  /** ISO-Zeitstempel des Messwerts. */
  date: string;
  /** Absoluter Zählerstand zu diesem Zeitpunkt. */
  value: number;
  /** Verbrauch seit dem vorherigen Messwert (0 beim ersten Wert). */
  consumption: number;
  /** Verbrauch pro Tag in diesem Intervall. */
  perDay: number;
}

/**
 * Zeitreihe für Graphen: pro Messwert der absolute Stand, der Intervallverbrauch
 * und der Verbrauch/Tag im jeweiligen Intervall.
 */
export function intervalSeries(readings: Reading[]): IntervalPoint[] {
  const sorted = sortReadings(readings);
  return sorted.map((r, i) => {
    if (i === 0) {
      return { date: r.reading_at, value: r.value, consumption: 0, perDay: 0 };
    }
    const prev = sorted[i - 1];
    const consumption = r.value - prev.value;
    const days =
      (new Date(r.reading_at).getTime() - new Date(prev.reading_at).getTime()) / MS_PER_DAY;
    return {
      date: r.reading_at,
      value: r.value,
      consumption,
      perDay: days > 0 ? consumption / days : 0,
    };
  });
}
