import { useState } from 'react';
import { Card, Group, Text, ThemeIcon, Button, Stack, Divider } from '@mantine/core';
import { IconPlus, IconChartLine } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { analyze } from '../lib/calculations';
import { getMeterIcon } from '../lib/icons';
import { formatCurrency, formatWithUnit, meterTerms } from '../lib/format';
import { ReadingFormModal } from './ReadingFormModal';
import type { Meter, Reading } from '../types';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={600}>{value}</Text>
    </div>
  );
}

export function MeterSummaryCard({ meter, readings }: { meter: Meter; readings: Reading[] }) {
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);

  const a = analyze(readings, meter.cost_per_unit);
  const Icon = getMeterIcon(meter.icon);
  const t = meterTerms(meter.kind);
  const hasData = a.count >= 2 && a.days > 0;

  return (
    <Card withBorder padding="md">
      <Group justify="space-between" wrap="nowrap">
        <Group wrap="nowrap">
          <ThemeIcon variant="light" size="xl" radius="md">
            <Icon size={24} />
          </ThemeIcon>
          <div>
            <Text fw={600}>{meter.name}</Text>
            <Text size="sm" c="dimmed">
              {a.lastValue !== null
                ? `Aktuell: ${formatWithUnit(a.lastValue, meter.decimals, meter.unit)}`
                : 'Noch kein Stand'}
            </Text>
          </div>
        </Group>
      </Group>

      <Divider my="sm" />

      <Group grow>
        <Stat
          label={`${t.amount} / Tag`}
          value={hasData ? formatWithUnit(a.perDay, meter.decimals, meter.unit) : '–'}
        />
        {t.hasMoney ? (
          <Stat label={`${t.money} / Jahr`} value={hasData ? formatCurrency(a.costPerYear) : '–'} />
        ) : (
          <Stat
            label={`${t.amount} / Jahr`}
            value={hasData ? formatWithUnit(a.perYear, meter.decimals, meter.unit) : '–'}
          />
        )}
      </Group>

      <Stack gap="xs" mt="md">
        <Button leftSection={<IconPlus size={18} />} onClick={() => setFormOpen(true)} fullWidth>
          Stand erfassen
        </Button>
        <Button
          variant="subtle"
          size="xs"
          leftSection={<IconChartLine size={16} />}
          onClick={() => navigate(`/meters/${meter.id}/analysis`)}
        >
          Auswertung ansehen
        </Button>
      </Stack>

      <ReadingFormModal opened={formOpen} onClose={() => setFormOpen(false)} meter={meter} />
    </Card>
  );
}
