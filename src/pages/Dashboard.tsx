import { useMemo } from 'react';
import { Title, Group, Button, SimpleGrid, Card, Text, Stack, Center, Loader } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useMeters } from '../hooks/useMeters';
import { useAllReadings } from '../hooks/useReadings';
import { summarizeByUnit } from '../lib/calculations';
import { MeterSummaryCard } from '../components/MeterSummaryCard';
import { UnitSummary } from '../components/UnitSummary';
import type { Reading } from '../types';

export function Dashboard() {
  const { data: meters, isLoading } = useMeters();
  const { data: allReadings } = useAllReadings();
  const navigate = useNavigate();

  // Zählerstände einmalig nach Zähler gruppieren (eine Abfrage statt N).
  const readingsByMeter = useMemo(() => {
    const map = new Map<string, Reading[]>();
    for (const r of allReadings ?? []) {
      const list = map.get(r.meter_id);
      if (list) list.push(r);
      else map.set(r.meter_id, [r]);
    }
    return map;
  }, [allReadings]);

  const summaries = useMemo(
    () => (meters ? summarizeByUnit(meters, readingsByMeter) : []),
    [meters, readingsByMeter],
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
              />
            ))}
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
}
