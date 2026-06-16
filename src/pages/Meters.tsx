import { useState } from 'react';
import {
  Title,
  Button,
  Group,
  Card,
  Text,
  ActionIcon,
  SimpleGrid,
  ThemeIcon,
  Menu,
  Stack,
  Center,
  Loader,
  Badge,
} from '@mantine/core';
import {
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconChartLine,
  IconListNumbers,
} from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useMeters, useDeleteMeter } from '../hooks/useMeters';
import { getMeterIcon } from '../lib/icons';
import { formatCurrency } from '../lib/format';
import { MeterFormModal } from '../components/MeterFormModal';
import type { Meter } from '../types';

export function Meters() {
  const { data: meters, isLoading } = useMeters();
  const del = useDeleteMeter();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Meter | undefined>();

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (meter: Meter) => {
    setEditing(meter);
    setFormOpen(true);
  };

  const confirmDelete = (meter: Meter) =>
    modals.openConfirmModal({
      title: 'Zähler löschen',
      children: (
        <Text size="sm">
          „{meter.name}" und alle zugehörigen Zählerstände werden unwiderruflich gelöscht.
        </Text>
      ),
      labels: { confirm: 'Löschen', cancel: 'Abbrechen' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await del.mutateAsync(meter.id);
        } catch (e) {
          notifications.show({ color: 'red', message: (e as Error).message });
        }
      },
    });

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
        <Title order={2}>Zähler</Title>
        <Button leftSection={<IconPlus size={18} />} onClick={openCreate}>
          Neuer Zähler
        </Button>
      </Group>

      {!meters?.length ? (
        <Card withBorder p="xl">
          <Text c="dimmed" ta="center">
            Noch keine Zähler. Lege deinen ersten Zähler an.
          </Text>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {meters.map((meter) => {
            const Icon = getMeterIcon(meter.icon);
            return (
              <Card key={meter.id} withBorder padding="md">
                <Group justify="space-between" wrap="nowrap">
                  <Group wrap="nowrap">
                    <ThemeIcon variant="light" size="xl" radius="md">
                      <Icon size={24} />
                    </ThemeIcon>
                    <div>
                      <Group gap="xs" wrap="nowrap">
                        <Text fw={600}>{meter.name}</Text>
                        {meter.kind === 'feed_in' && (
                          <Badge size="xs" variant="light" color="green">
                            Einspeisung
                          </Badge>
                        )}
                        {meter.kind === 'info' && (
                          <Badge size="xs" variant="light" color="gray">
                            Info
                          </Badge>
                        )}
                      </Group>
                      <Text size="sm" c="dimmed">
                        {meter.unit} · {meter.decimals} NK
                        {meter.kind !== 'info' &&
                          ` · ${formatCurrency(meter.cost_per_unit)}/${meter.unit}`}
                      </Text>
                    </div>
                  </Group>
                  <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                      <ActionIcon variant="subtle" aria-label="Aktionen">
                        <IconDotsVertical size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconListNumbers size={16} />}
                        onClick={() => navigate(`/meters/${meter.id}/readings`)}
                      >
                        Stände
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconChartLine size={16} />}
                        onClick={() => navigate(`/meters/${meter.id}/analysis`)}
                      >
                        Auswertung
                      </Menu.Item>
                      <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => openEdit(meter)}>
                        Bearbeiten
                      </Menu.Item>
                      <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={16} />}
                        onClick={() => confirmDelete(meter)}
                      >
                        Löschen
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
                <Group mt="md" grow>
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconListNumbers size={16} />}
                    onClick={() => navigate(`/meters/${meter.id}/readings`)}
                  >
                    Stände
                  </Button>
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconChartLine size={16} />}
                    onClick={() => navigate(`/meters/${meter.id}/analysis`)}
                  >
                    Auswertung
                  </Button>
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      <MeterFormModal opened={formOpen} onClose={() => setFormOpen(false)} meter={editing} />
    </Stack>
  );
}
