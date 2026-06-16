import { useState } from 'react';
import { Button, Group, Table, ActionIcon, Stack, Card, Text } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { usePurchases, useDeletePurchase } from '../hooks/usePurchases';
import { PurchaseFormModal } from './PurchaseFormModal';
import { formatCurrency, formatNumber } from '../lib/format';
import type { Meter, Purchase } from '../types';

export function PurchasesPanel({ meter }: { meter: Meter }) {
  const { data: purchases } = usePurchases(meter.id);
  const del = useDeletePurchase(meter.id);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Purchase | undefined>();

  // Neueste zuerst anzeigen.
  const rows = [...(purchases ?? [])].sort(
    (a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime(),
  );

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (p: Purchase) => {
    setEditing(p);
    setFormOpen(true);
  };

  const confirmDelete = (p: Purchase) =>
    modals.openConfirmModal({
      title: 'Zukauf löschen',
      children: <Text size="sm">Diesen Zukauf wirklich löschen?</Text>,
      labels: { confirm: 'Löschen', cancel: 'Abbrechen' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await del.mutateAsync(p.id);
        } catch (e) {
          notifications.show({ color: 'red', message: (e as Error).message });
        }
      },
    });

  return (
    <Stack>
      <Group justify="flex-end">
        <Button leftSection={<IconPlus size={18} />} onClick={openCreate}>
          Zukauf erfassen
        </Button>
      </Group>

      {!rows.length ? (
        <Card withBorder p="xl">
          <Text c="dimmed" ta="center">
            Noch keine Zukäufe erfasst.
          </Text>
        </Card>
      ) : (
        <Card withBorder p={0}>
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Kaufdatum</Table.Th>
                <Table.Th ta="right">Menge</Table.Th>
                <Table.Th ta="right">Gesamtpreis</Table.Th>
                <Table.Th ta="right">Stückpreis</Table.Th>
                <Table.Th w={100} ta="right">
                  Aktionen
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>{dayjs(p.purchased_at).format('DD.MM.YYYY HH:mm')}</Table.Td>
                  <Table.Td ta="right">
                    {formatNumber(p.quantity, meter.decimals)} {meter.unit}
                  </Table.Td>
                  <Table.Td ta="right">{formatCurrency(p.total_price)}</Table.Td>
                  <Table.Td ta="right">
                    {p.quantity > 0 ? `${formatCurrency(p.total_price / p.quantity)}/${meter.unit}` : '–'}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end" wrap="nowrap">
                      <ActionIcon variant="subtle" onClick={() => openEdit(p)} aria-label="Bearbeiten">
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => confirmDelete(p)}
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

      <PurchaseFormModal
        opened={formOpen}
        onClose={() => setFormOpen(false)}
        meter={meter}
        purchase={editing}
      />
    </Stack>
  );
}
