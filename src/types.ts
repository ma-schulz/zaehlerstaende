export interface Meter {
  id: string;
  user_id: string;
  name: string;
  unit: string;
  icon: string;
  decimals: number;
  cost_per_unit: number;
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
  'name' | 'unit' | 'icon' | 'decimals' | 'cost_per_unit'
>;

/** Eingabe-Werte beim Anlegen/Bearbeiten eines Zählerstands. */
export interface ReadingInput {
  value: number;
  reading_at: string;
}
