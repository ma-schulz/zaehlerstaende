import { describe, it, expect } from 'vitest';
import {
  analyze,
  analyzeMeter,
  fifoStock,
  intervalSeries,
  sortReadings,
  summarizeByUnit,
} from './calculations';
import type { Meter, MeterKind, Purchase, Reading } from '../types';

function reading(value: number, reading_at: string, meter_id = 'm'): Reading {
  return { id: `${meter_id}-${reading_at}`, meter_id, value, reading_at, created_at: reading_at };
}

function purchase(quantity: number, total_price: number, purchased_at: string): Purchase {
  return { id: purchased_at, meter_id: 'm', quantity, total_price, purchased_at, created_at: purchased_at };
}

function meter(id: string, kind: MeterKind, cost: number, unit = 'kWh', line_bound = true): Meter {
  return {
    id,
    user_id: 'u',
    name: id,
    unit,
    icon: 'gauge',
    decimals: 1,
    cost_per_unit: cost,
    kind,
    line_bound,
    created_at: '2024-01-01T00:00:00Z',
  };
}

describe('sortReadings', () => {
  it('sorts ascending by reading_at without mutating input', () => {
    const input = [
      reading(20, '2024-01-10T00:00:00Z'),
      reading(10, '2024-01-01T00:00:00Z'),
    ];
    const sorted = sortReadings(input);
    expect(sorted.map((r) => r.value)).toEqual([10, 20]);
    expect(input[0].value).toBe(20); // Original unverändert
  });
});

describe('analyze', () => {
  it('returns zeros with fewer than two readings', () => {
    expect(analyze([], 0.35).perDay).toBe(0);
    expect(analyze([reading(100, '2024-01-01T00:00:00Z')], 0.35).totalConsumption).toBe(0);
  });

  it('treats the first reading as baseline and computes consumption to the last', () => {
    // 100 -> 200 -> 300 über 100 Tage = 200 Verbrauch
    const readings = [
      reading(100, '2024-01-01T00:00:00Z'),
      reading(200, '2024-02-20T00:00:00Z'),
      reading(300, '2024-04-10T00:00:00Z'),
    ];
    const a = analyze(readings, 0.35);
    expect(a.firstValue).toBe(100);
    expect(a.lastValue).toBe(300);
    expect(a.totalConsumption).toBe(200);
    expect(a.days).toBe(100);
    expect(a.perDay).toBeCloseTo(2, 6);
    expect(a.perYear).toBeCloseTo(730, 6);
    expect(a.costPerDay).toBeCloseTo(0.7, 6);
    expect(a.costPerYear).toBeCloseTo(255.5, 6);
  });

  it('handles unsorted input', () => {
    const readings = [
      reading(300, '2024-04-10T00:00:00Z'),
      reading(100, '2024-01-01T00:00:00Z'),
    ];
    const a = analyze(readings, 1);
    expect(a.totalConsumption).toBe(200);
  });

  it('avoids division by zero when readings share a timestamp', () => {
    const readings = [
      reading(100, '2024-01-01T00:00:00Z'),
      reading(150, '2024-01-01T00:00:00Z'),
    ];
    const a = analyze(readings, 1);
    expect(a.totalConsumption).toBe(50);
    expect(a.perDay).toBe(0);
  });
});

describe('summarizeByUnit', () => {
  // Über 365 Tage je 0->365 = 1 Einheit/Tag => perYear = 365.
  const span = (start: number, end: number, id: string) => [
    reading(start, '2024-01-01T00:00:00Z', id),
    reading(end, '2024-12-31T00:00:00Z', id),
  ];

  it('subtracts feed-in meters and ignores info meters per unit', () => {
    const meters = [
      meter('consume', 'consumption', 0.35),
      meter('pv', 'feed_in', 0.08),
      meter('info', 'info', 0),
    ];
    const readings = new Map<string, Reading[]>([
      ['consume', span(0, 365, 'consume')], // 365 kWh/Jahr
      ['pv', span(0, 146, 'pv')], // 146 kWh/Jahr eingespeist
      ['info', span(0, 999, 'info')], // zählt nicht
    ]);

    const [summary] = summarizeByUnit(meters, readings, new Map());
    expect(summary.unit).toBe('kWh');
    expect(summary.meterCount).toBe(2); // Info ausgeschlossen
    expect(summary.perYear).toBeCloseTo(365 - 146, 4);
    expect(summary.costPerYear).toBeCloseTo(365 * 0.35 - 146 * 0.08, 4);
  });

  it('groups separate units independently', () => {
    const meters = [meter('strom', 'consumption', 0.35, 'kWh'), meter('wasser', 'consumption', 2, 'm³')];
    const readings = new Map<string, Reading[]>([
      ['strom', span(0, 365, 'strom')],
      ['wasser', span(0, 365, 'wasser')],
    ]);
    const result = summarizeByUnit(meters, readings, new Map());
    expect(result.map((r) => r.unit)).toEqual(['kWh', 'm³']);
  });
});

describe('fifoStock', () => {
  it('charges consumption against purchases in chronological order', () => {
    // Lot 1: 3 t @ 100/t, Lot 2: 2 t @ 200/t. Verbrauch 4 t.
    const purchases = [
      purchase(3, 300, '2024-01-01T00:00:00Z'), // 100/t
      purchase(2, 400, '2024-03-01T00:00:00Z'), // 200/t
    ];
    const s = fifoStock(purchases, 4);
    expect(s.totalPurchased).toBe(5);
    expect(s.stock).toBe(1);
    // 3 t aus Lot 1 (300) + 1 t aus Lot 2 (200) = 500
    expect(s.fifoCost).toBeCloseTo(500, 6);
    expect(s.avgUnitPrice).toBeCloseTo(125, 6);
  });

  it('only costs the available quantity when consumption exceeds purchases', () => {
    const s = fifoStock([purchase(2, 200, '2024-01-01T00:00:00Z')], 5);
    expect(s.fifoCost).toBeCloseTo(200, 6); // nur 2 t verrechenbar
    expect(s.stock).toBe(-3);
  });
});

describe('analyzeMeter', () => {
  it('uses the tariff for line-bound meters and reports no stock', () => {
    const m = meter('strom', 'consumption', 0.35, 'kWh', true);
    const readings = [
      reading(0, '2024-01-01T00:00:00Z', 'strom'),
      reading(100, '2024-01-11T00:00:00Z', 'strom'), // 10/Tag
    ];
    const a = analyzeMeter(m, readings, []);
    expect(a.stockInfo).toBeNull();
    expect(a.costPerDay).toBeCloseTo(10 * 0.35, 6);
  });

  it('uses FIFO cost and stock for non-line-bound meters', () => {
    const m = meter('pellets', 'consumption', 0, 't', false);
    const readings = [
      reading(0, '2024-01-01T00:00:00Z', 'pellets'),
      reading(4, '2024-01-11T00:00:00Z', 'pellets'), // 4 t über 10 Tage
    ];
    const purchases = [
      purchase(3, 300, '2024-01-01T00:00:00Z'), // 100/t
      purchase(2, 400, '2024-01-05T00:00:00Z'), // 200/t
    ];
    const a = analyzeMeter(m, readings, purchases);
    expect(a.stockInfo?.stock).toBe(1); // 5 gekauft − 4 verbraucht
    expect(a.stockInfo?.fifoCost).toBeCloseTo(500, 6);
    expect(a.costPerDay).toBeCloseTo(50, 6); // 500 / 10 Tage
    expect(a.costPerYear).toBeCloseTo(50 * 365, 6);
  });
});

describe('intervalSeries', () => {
  it('reports per-interval consumption with zero on the first point', () => {
    const readings = [
      reading(100, '2024-01-01T00:00:00Z'),
      reading(110, '2024-01-11T00:00:00Z'),
    ];
    const series = intervalSeries(readings);
    expect(series).toHaveLength(2);
    expect(series[0].consumption).toBe(0);
    expect(series[1].consumption).toBe(10);
    expect(series[1].perDay).toBeCloseTo(1, 6);
  });
});
