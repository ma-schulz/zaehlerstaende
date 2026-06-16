import type { Meter, Reading } from '../types';

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
): UnitSummary[] {
  const byUnit = new Map<string, UnitSummary>();

  for (const meter of meters) {
    if (meter.kind === 'info') continue;
    const a = analyze(readingsByMeter.get(meter.id) ?? [], meter.cost_per_unit);
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
