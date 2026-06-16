import { Card, Table, Text, Title, Stack } from '@mantine/core';
import type { UnitSummary as UnitSummaryData } from '../lib/calculations';
import { formatCurrency, formatWithUnit } from '../lib/format';

/** Summenzeile je Einheit: Netto-Verbrauch und -Kosten (Einspeisung abgezogen). */
export function UnitSummary({ summaries }: { summaries: UnitSummaryData[] }) {
  if (!summaries.length) return null;

  return (
    <Card withBorder padding="md">
      <Stack gap={4} mb="sm">
        <Title order={5}>Zusammenfassung pro Einheit</Title>
        <Text size="xs" c="dimmed">
          Hochrechnung pro Jahr · Einspeisung abgezogen · Info-Zähler ausgenommen
        </Text>
      </Stack>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Einheit</Table.Th>
            <Table.Th ta="right">Verbrauch / Jahr</Table.Th>
            <Table.Th ta="right">Kosten / Jahr</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {summaries.map((s) => (
            <Table.Tr key={s.unit}>
              <Table.Td fw={600}>{s.unit}</Table.Td>
              <Table.Td ta="right">{formatWithUnit(s.perYear, s.decimals, s.unit)}</Table.Td>
              <Table.Td ta="right" c={s.costPerYear < 0 ? 'teal' : undefined}>
                {formatCurrency(s.costPerYear)}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
}
