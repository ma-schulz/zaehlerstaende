import { useState } from 'react';
import { Button, Group, Table, ActionIcon, Stack, Card, Text, Badge } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useReadings, useDeleteReading } from '../hooks/useReadings';
import { ReadingFormModal } from './ReadingFormModal';
import { formatNumber } from '../lib/format';
import { sortReadings } from '../lib/calculations';
import type { Meter, Reading } from '../types';

export function ReadingsPanel({ meter }: { meter: Meter }) {
  const { data: readings } = useReadings(meter.id);
  const del = useDeleteReading(meter.id);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reading | undefined>();

  // Neueste zuerst anzeigen; den chronologisch ersten Wert als Anfangsstand markieren.
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
      <Group justify="flex-end">
        <Button leftSection={<IconPlus size={18} />} onClick={openCreate}>
          Stand erfassen
        </Button>
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
