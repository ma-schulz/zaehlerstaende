import { describe, it, expect } from 'vitest';
import { analyze, intervalSeries, sortReadings } from './calculations';
import type { Reading } from '../types';

function reading(value: number, reading_at: string): Reading {
  return { id: reading_at, meter_id: 'm', value, reading_at, created_at: reading_at };
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
