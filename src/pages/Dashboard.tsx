import { useMemo } from 'react';
import { Title, Group, Button, SimpleGrid, Card, Text, Stack, Center, Loader } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useMeters } from '../hooks/useMeters';
import { useAllReadings } from '../hooks/useReadings';
import { useAllPurchases } from '../hooks/usePurchases';
import { summarizeByUnit } from '../lib/calculations';
import { MeterSummaryCard } from '../components/MeterSummaryCard';
import { UnitSummary } from '../components/UnitSummary';
import type { Purchase, Reading } from '../types';

/** Liste nach meter_id gruppieren. */
function groupByMeter<T extends { meter_id: string }>(items: T[] | undefined): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items ?? []) {
    const list = map.get(item.meter_id);
    if (list) list.push(item);
    else map.set(item.meter_id, [item]);
  }
  return map;
}

export function Dashboard() {
  const { data: meters, isLoading } = useMeters();
  const { data: allReadings } = useAllReadings();
  const { data: allPurchases } = useAllPurchases();
  const navigate = useNavigate();

  // Stände und Zukäufe einmalig je Zähler gruppieren (je eine Abfrage statt N).
  const readingsByMeter = useMemo(() => groupByMeter<Reading>(allReadings), [allReadings]);
  const purchasesByMeter = useMemo(() => groupByMeter<Purchase>(allPurchases), [allPurchases]);

  const summaries = useMemo(
    () => (meters ? summarizeByUnit(meters, readingsByMeter, purchasesByMeter) : []),
    [meters, readingsByMeter, purchasesByMeter],
  );

  if (isLoading) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Dashboard</Title>
        <Button variant="default" leftSection={<IconPlus size={18} />} onClick={() => navigate('/meters')}>
          Zähler verwalten
        </Button>
      </Group>

      {!meters?.length ? (
        <Card withBorder p="xl">
          <Stack align="center">
            <Text c="dimmed">Noch keine Zähler angelegt.</Text>
            <Button leftSection={<IconPlus size={18} />} onClick={() => navigate('/meters')}>
              Ersten Zähler anlegen
            </Button>
          </Stack>
        </Card>
      ) : (
        <>
          <UnitSummary summaries={summaries} />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {meters.map((meter) => (
              <MeterSummaryCard
                key={meter.id}
                meter={meter}
                readings={readingsByMeter.get(meter.id) ?? []}
                purchases={purchasesByMeter.get(meter.id) ?? []}
              />
            ))}
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
}
