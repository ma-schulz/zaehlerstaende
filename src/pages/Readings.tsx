import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Title,
  Button,
  Group,
  Table,
  ActionIcon,
  Stack,
  Card,
  Text,
  ThemeIcon,
  Badge,
  Center,
  Loader,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconArrowLeft,
  IconChartLine,
} from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useMeter } from '../hooks/useMeters';
import { useReadings, useDeleteReading } from '../hooks/useReadings';
import { ReadingFormModal } from '../components/ReadingFormModal';
import { getMeterIcon } from '../lib/icons';
import { formatNumber } from '../lib/format';
import { sortReadings } from '../lib/calculations';
import type { Reading } from '../types';

export function Readings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meter = useMeter(id);
  const { data: readings, isLoading } = useReadings(id);
  const del = useDeleteReading(id ?? '');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reading | undefined>();

  if (!meter) {
    return (
      <Center h={200}>
        {isLoading ? <Loader /> : <Text c="dimmed">Zähler nicht gefunden.</Text>}
      </Center>
    );
  }

  const Icon = getMeterIcon(meter.icon);
  // Neueste zuerst für die Anzeige; den chronologisch ersten Wert als Anfangsstand markieren.
  const sorted = sortReadings(readings ?? []);
  const baselineId = sorted[0]?.id;
  const rows = [...sorted].reverse();

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (r: Reading) => {
    setEditing(r);
    setFormOpen(true);
  };

  const confirmDelete = (r: Reading) =>
    modals.openConfirmModal({
      title: 'Stand löschen',
      children: <Text size="sm">Diesen Zählerstand wirklich löschen?</Text>,
      labels: { confirm: 'Löschen', cancel: 'Abbrechen' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await del.mutateAsync(r.id);
        } catch (e) {
          notifications.show({ color: 'red', message: (e as Error).message });
        }
      },
    });

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
        <Group gap="xs">
          <Button
            variant="default"
            leftSection={<IconChartLine size={18} />}
            onClick={() => navigate(`/meters/${meter.id}/analysis`)}
            visibleFrom="xs"
          >
            Auswertung
          </Button>
          <Button leftSection={<IconPlus size={18} />} onClick={openCreate}>
            Stand erfassen
          </Button>
        </Group>
      </Group>

      {!rows.length ? (
        <Card withBorder p="xl">
          <Text c="dimmed" ta="center">
            Noch keine Zählerstände erfasst.
          </Text>
        </Card>
      ) : (
        <Card withBorder p={0}>
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Datum & Uhrzeit</Table.Th>
                <Table.Th ta="right">Stand</Table.Th>
                <Table.Th w={100} ta="right">
                  Aktionen
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>
                    {dayjs(r.reading_at).format('DD.MM.YYYY HH:mm')}
                    {r.id === baselineId && (
                      <Badge ml="xs" size="xs" variant="light" color="gray">
                        Anfangsstand
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td ta="right">
                    {formatNumber(r.value, meter.decimals)} {meter.unit}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end" wrap="nowrap">
                      <ActionIcon variant="subtle" onClick={() => openEdit(r)} aria-label="Bearbeiten">
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => confirmDelete(r)}
                        aria-label="Löschen"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <ReadingFormModal
        opened={formOpen}
        onClose={() => setFormOpen(false)}
        meter={meter}
        reading={editing}
      />
    </Stack>
  );
}
