import { useParams, useNavigate } from 'react-router-dom';
import {
  Title,
  Button,
  Group,
  Stack,
  ThemeIcon,
  Center,
  Loader,
  Text,
  Tabs,
  ActionIcon,
} from '@mantine/core';
import { IconArrowLeft, IconChartLine, IconListNumbers, IconShoppingCart } from '@tabler/icons-react';
import { useMeter } from '../hooks/useMeters';
import { useReadings } from '../hooks/useReadings';
import { ReadingsPanel } from '../components/ReadingsPanel';
import { PurchasesPanel } from '../components/PurchasesPanel';
import { getMeterIcon } from '../lib/icons';

export function Readings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meter = useMeter(id);
  const { isLoading } = useReadings(id);

  if (!meter) {
    return (
      <Center h={200}>
        {isLoading ? <Loader /> : <Text c="dimmed">Zähler nicht gefunden.</Text>}
      </Center>
    );
  }

  const Icon = getMeterIcon(meter.icon);
  // Zukäufe nur für nicht leitungsgebundene Verbrauchszähler (z.B. Pellets).
  const showPurchases = meter.kind === 'consumption' && !meter.line_bound;

  return (
    <Stack>
      <Group justify="space-between" wrap="nowrap">
        <Group wrap="nowrap">
          <ActionIcon variant="subtle" size="lg" onClick={() => navigate('/meters')} aria-label="Zurück">
            <IconArrowLeft size={20} />
          </ActionIcon>
          <ThemeIcon variant="light" size="lg" radius="md">
            <Icon size={20} />
          </ThemeIcon>
          <Title order={3}>{meter.name}</Title>
        </Group>
        <Button
          variant="default"
          leftSection={<IconChartLine size={18} />}
          onClick={() => navigate(`/meters/${meter.id}/analysis`)}
          visibleFrom="xs"
        >
          Auswertung
        </Button>
      </Group>

      {showPurchases ? (
        <Tabs defaultValue="readings">
          <Tabs.List mb="md">
            <Tabs.Tab value="readings" leftSection={<IconListNumbers size={16} />}>
              Stände
            </Tabs.Tab>
            <Tabs.Tab value="purchases" leftSection={<IconShoppingCart size={16} />}>
              Zukäufe
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="readings">
            <ReadingsPanel meter={meter} />
          </Tabs.Panel>
          <Tabs.Panel value="purchases">
            <PurchasesPanel meter={meter} />
          </Tabs.Panel>
        </Tabs>
      ) : (
        <ReadingsPanel meter={meter} />
      )}
    </Stack>
  );
}
