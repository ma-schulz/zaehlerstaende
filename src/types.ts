/**
 * Zählerart:
 * - `consumption`: normaler Verbrauchszähler (Kosten)
 * - `feed_in`: Einspeisezähler – cost_per_unit gilt als Vergütung, Ergebnis ist ein Ertrag
 * - `info`: reiner Info-Zähler ohne Kosten
 */
export type MeterKind = 'consumption' | 'feed_in' | 'info';

export interface Meter {
  id: string;
  user_id: string;
  name: string;
  unit: string;
  icon: string;
  decimals: number;
  cost_per_unit: number;
  kind: MeterKind;
  created_at: string;
}

export interface Reading {
  id: string;
  meter_id: string;
  value: number;
  reading_at: string;
  created_at: string;
}

/** Eingabe-Werte beim Anlegen/Bearbeiten eines Zählers. */
export type MeterInput = Pick<
  Meter,
  'name' | 'unit' | 'icon' | 'decimals' | 'cost_per_unit' | 'kind'
>;

/** Eingabe-Werte beim Anlegen/Bearbeiten eines Zählerstands. */
export interface ReadingInput {
  value: number;
  reading_at: string;
}
