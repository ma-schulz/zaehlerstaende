import { Title, Group, Button, SimpleGrid, Card, Text, Stack, Center, Loader } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useMeters } from '../hooks/useMeters';
import { MeterSummaryCard } from '../components/MeterSummaryCard';

export function Dashboard() {
  const { data: meters, isLoading } = useMeters();
  const navigate = useNavigate();

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
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {meters.map((meter) => (
            <MeterSummaryCard key={meter.id} meter={meter} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
